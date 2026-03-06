import { createClient } from "@supabase/supabase-js";
import type { CampaignLead, Campaign, WorkflowNode, WorkflowEdge } from "@/types";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function findNextNode(
  edges: WorkflowEdge[],
  currentNodeId: string,
  sourceHandle?: string
): string | null {
  const edge = edges.find(
    (e) =>
      e.source === currentNodeId &&
      (sourceHandle ? e.sourceHandle === sourceHandle : true)
  );
  return edge?.target ?? null;
}

async function advanceTo(
  supabase: ReturnType<typeof getSupabase>,
  clId: string,
  nextNodeId: string
) {
  await supabase
    .from("campaign_leads")
    .update({
      current_node_id: nextNodeId,
      status: "queued",
      next_action_time: new Date().toISOString(),
      last_action_time: new Date().toISOString(),
    })
    .eq("id", clId);
}

async function setWaiting(
  supabase: ReturnType<typeof getSupabase>,
  clId: string,
  nextNodeId: string,
  delayMs: number
) {
  await supabase
    .from("campaign_leads")
    .update({
      current_node_id: nextNodeId,
      status: "waiting",
      next_action_time: new Date(Date.now() + delayMs).toISOString(),
      last_action_time: new Date().toISOString(),
    })
    .eq("id", clId);
}

async function markCompleted(
  supabase: ReturnType<typeof getSupabase>,
  clId: string
) {
  await supabase
    .from("campaign_leads")
    .update({
      status: "completed",
      last_action_time: new Date().toISOString(),
    })
    .eq("id", clId);
}

async function markFailed(
  supabase: ReturnType<typeof getSupabase>,
  clId: string,
  reason: string
) {
  await supabase
    .from("campaign_leads")
    .update({
      status: "failed",
      last_action_time: new Date().toISOString(),
    })
    .eq("id", clId);

  await logAction(supabase, clId, "error", "failed", { reason });
}

async function logAction(
  supabase: ReturnType<typeof getSupabase>,
  campaignLeadId: string,
  action: string,
  status: string,
  metadata?: Record<string, unknown>
) {
  await supabase.from("logs").insert({
    campaign_lead_id: campaignLeadId,
    action,
    status,
    metadata: metadata || null,
  });
}

export async function processActiveCampaigns(): Promise<{ processed: number; errors: number }> {
  const supabase = getSupabase();
  let processed = 0;
  let errors = 0;

  const { data: activeCampaigns, error: campErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active");

  if (campErr || !activeCampaigns?.length) {
    return { processed: 0, errors: 0 };
  }

  for (const campaign of activeCampaigns as Campaign[]) {
    const nowIso = new Date().toISOString();
    const { data: pendingLeads, error: plErr } = await supabase
      .from("campaign_leads")
      .select("*, lead:leads(*)")
      .eq("campaign_id", campaign.id)
      .in("status", ["queued", "waiting"])
      .limit(200);

    if (plErr || !pendingLeads?.length) continue;

    const dueLeads = (pendingLeads as CampaignLead[]).filter((cl) => {
      if (!cl.next_action_time) return true;
      return cl.next_action_time <= nowIso;
    });

    if (!dueLeads.length) continue;

    const nodes = campaign.workflow_json.nodes as WorkflowNode[];
    const edges = campaign.workflow_json.edges as WorkflowEdge[];

    for (const cl of dueLeads) {
      try {
        const currentNode = nodes.find((n) => n.id === cl.current_node_id);
        if (!currentNode) {
          await markFailed(supabase, cl.id, `Node ${cl.current_node_id} not found`);
          errors++;
          continue;
        }

        switch (currentNode.type) {
          case "start": {
            const nextId = findNextNode(edges, currentNode.id);
            if (!nextId) {
              await markFailed(supabase, cl.id, "No edge from Start node");
              errors++;
              break;
            }
            await advanceTo(supabase, cl.id, nextId);
            await logAction(supabase, cl.id, "start", "success");
            processed++;
            break;
          }

          case "send_email": {
            // In MVP without Gmail configured, log the action and advance
            const subjectPrompt = (currentNode.data.subject_prompt as string) || "Outreach email";
            const bodyPrompt = (currentNode.data.body_prompt as string) || "";

            let sendResult: { threadId?: string } = {};

            try {
              const { sendEmail } = await import("@/lib/gmail");
              const { generateMessage } = await import("@/lib/openai");
              const lead = cl.lead!;
              const msg = await generateMessage(
                { subject_prompt: subjectPrompt, body_prompt: bodyPrompt },
                lead
              );
              const result = await sendEmail(
                lead.email,
                msg.subject,
                msg.body,
                cl.thread_id || undefined
              );
              sendResult = { threadId: result.threadId };

              if (campaign.gmail_label_id) {
                try {
                  const { applyLabelToThread } = await import("@/lib/gmail");
                  await applyLabelToThread(result.threadId, campaign.gmail_label_id);
                } catch {
                  // Label application is non-critical
                }
              }
            } catch (err) {
              // If Gmail/OpenAI not configured, log and continue
              console.warn("Email send skipped (not configured):", err);
              await logAction(supabase, cl.id, "send_email", "skipped", {
                reason: "Gmail/OpenAI not configured",
                subject_prompt: subjectPrompt,
              });
            }

            if (sendResult.threadId) {
              await supabase
                .from("campaign_leads")
                .update({ thread_id: sendResult.threadId })
                .eq("id", cl.id);
            }

            await logAction(supabase, cl.id, "send_email", sendResult.threadId ? "success" : "skipped", {
              subject_prompt: subjectPrompt,
              thread_id: sendResult.threadId,
            });

            const nextId = findNextNode(edges, currentNode.id);
            if (nextId) {
              await advanceTo(supabase, cl.id, nextId);
            } else {
              await markCompleted(supabase, cl.id);
            }
            processed++;
            break;
          }

          case "wait": {
            const duration = (currentNode.data.duration as number) || 1;
            const unit = (currentNode.data.unit as string) || "days";
            const delayMs = duration * (unit === "days" ? 86400000 : 3600000);

            const nextId = findNextNode(edges, currentNode.id);
            if (nextId) {
              await setWaiting(supabase, cl.id, nextId, delayMs);
              await logAction(supabase, cl.id, "wait", "success", {
                duration,
                unit,
                resume_at: new Date(Date.now() + delayMs).toISOString(),
              });
            } else {
              await markCompleted(supabase, cl.id);
            }
            processed++;
            break;
          }

          case "condition": {
            const check = (currentNode.data.check as string) || "replied";
            let conditionMet = false;

            if (check === "replied" || check === "not_replied") {
              if (cl.thread_id) {
                try {
                  const { hasThreadReceivedReply } = await import("@/lib/gmail");
                  const hasReply = await hasThreadReceivedReply(
                    cl.thread_id,
                    process.env.GMAIL_USER_EMAIL!
                  );
                  conditionMet = check === "replied" ? hasReply : !hasReply;

                  if (hasReply) {
                    await supabase
                      .from("campaign_leads")
                      .update({ replied: true })
                      .eq("id", cl.id);
                  }
                } catch {
                  // If Gmail not configured, assume not replied
                  conditionMet = check === "not_replied";
                }
              } else {
                conditionMet = check === "not_replied";
              }
            }

            const handle = conditionMet ? "yes" : "no";
            const nextId = findNextNode(edges, currentNode.id, handle);

            await logAction(supabase, cl.id, "condition", "success", {
              check,
              result: conditionMet,
              branch: handle,
            });

            if (nextId) {
              await advanceTo(supabase, cl.id, nextId);
            } else {
              await markCompleted(supabase, cl.id);
            }
            processed++;
            break;
          }

          case "end": {
            await markCompleted(supabase, cl.id);
            await logAction(supabase, cl.id, "end", "success");
            processed++;
            break;
          }

          default: {
            await markFailed(supabase, cl.id, `Unknown node type: ${currentNode.type}`);
            errors++;
          }
        }
      } catch (err) {
        console.error(`Error processing campaign_lead ${cl.id}:`, err);
        await markFailed(supabase, cl.id, String(err));
        errors++;
      }
    }
  }

  return { processed, errors };
}
