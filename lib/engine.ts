import { createClient } from "@supabase/supabase-js";
import type { Campaign, CampaignLead, Lead, WorkflowNode } from "@/types";
import {
  parseWorkflow,
  runWorkflow,
  type ParsedWorkflow,
  type ParsedWorkflowNode,
  type WorkflowHandlers,
} from "@/lib/workflow-engine";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

async function markFailed(
  supabase: ReturnType<typeof getSupabase>,
  campaignLeadId: string,
  reason: string
) {
  await supabase
    .from("campaign_leads")
    .update({
      status: "failed",
      last_action_time: new Date().toISOString(),
    })
    .eq("id", campaignLeadId);

  await logAction(supabase, campaignLeadId, "error", "failed", { reason });
}

function getWaitDelayMs(node: ParsedWorkflowNode): number {
  const days = Number(node.data.days);
  if (Number.isFinite(days) && days > 0) {
    return days * 86400000;
  }

  const duration = Number(node.data.duration) || 1;
  const unit = String(node.data.unit || "days");
  const unitToMs: Record<string, number> = {
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
  };
  return duration * (unitToMs[unit] || unitToMs.days);
}

function getPromptText(node: WorkflowNode, key: "subject_prompt" | "body_prompt") {
  const value = node.data[key];
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  const template = typeof node.data.template === "string" ? node.data.template : "";
  if (!template) {
    return key === "subject_prompt" ? "Outreach email" : "";
  }

  return key === "subject_prompt"
    ? `Write a concise ${template} email subject line`
    : `Write a ${template} outreach email for this lead`;
}

interface CampaignExecutionContext {
  supabase: ReturnType<typeof getSupabase>;
  campaign: Campaign;
  campaignLead: CampaignLead;
  lead: Lead;
  productDescription?: string;
  threadId?: string;
  replied: boolean;
}

const campaignHandlers: WorkflowHandlers<CampaignExecutionContext> = {
  start: async (node, context) => {
    await logAction(context.supabase, context.campaignLead.id, node.normalizedType, "success");
  },

  send_email: async (node, context) => {
    const subjectPrompt = getPromptText(node, "subject_prompt");
    const bodyPrompt = getPromptText(node, "body_prompt");
    let threadId = context.threadId;

    try {
      const { sendEmail, applyLabelToThread } = await import("@/lib/gmail");
      const { generateMessage } = await import("@/lib/openai");
      const message = await generateMessage(
        {
          subject_prompt: subjectPrompt,
          body_prompt: bodyPrompt,
        },
        context.lead,
        context.productDescription
      );

      const sent = await sendEmail(
        context.lead.email,
        message.subject,
        message.body,
        threadId
      );

      threadId = sent.threadId;
      context.threadId = sent.threadId;

      await context.supabase
        .from("campaign_leads")
        .update({ thread_id: sent.threadId })
        .eq("id", context.campaignLead.id);

      if (context.campaign.gmail_label_id) {
        try {
          await applyLabelToThread(sent.threadId, context.campaign.gmail_label_id);
        } catch {
          // Labeling is best-effort only.
        }
      }
    } catch (error) {
      console.warn("Email send skipped:", error);
    }

    await logAction(
      context.supabase,
      context.campaignLead.id,
      "send_email",
      threadId ? "success" : "skipped",
      {
        subject_prompt: subjectPrompt,
        thread_id: threadId,
      }
    );
  },

  wait: async (node, context) => {
    const delayMs = getWaitDelayMs(node);

    await logAction(context.supabase, context.campaignLead.id, "wait", "success", {
      resume_at: new Date(Date.now() + delayMs).toISOString(),
      days: node.data.days ?? null,
      duration: node.data.duration ?? null,
      unit: node.data.unit ?? null,
    });

    return { delayMs };
  },

  condition: async (node, context) => {
    const check = String(node.data.check || "replied");
    let hasReply = false;

    if (context.threadId) {
      try {
        const { hasThreadReceivedReply } = await import("@/lib/gmail");
        hasReply = await hasThreadReceivedReply(
          context.threadId,
          process.env.GMAIL_USER_EMAIL!
        );
      } catch {
        hasReply = false;
      }
    }

    const replied = check === "not_replied" ? !hasReply : hasReply;
    const branch = replied ? "yes" : "no";

    if (hasReply && !context.replied) {
      context.replied = true;
      await context.supabase
        .from("campaign_leads")
        .update({ replied: true })
        .eq("id", context.campaignLead.id);
    }

    await logAction(context.supabase, context.campaignLead.id, "condition", "success", {
      check,
      result: replied,
      branch,
    });

    return { branch };
  },

  end: async (_node, context) => {
    await logAction(context.supabase, context.campaignLead.id, "end", "success");
    return { stop: true };
  },
};

async function processCampaignLead(
  supabase: ReturnType<typeof getSupabase>,
  campaign: Campaign,
  campaignLead: CampaignLead,
  parsedWorkflow: ParsedWorkflow,
  productDescription?: string
) {
  if (!campaignLead.lead) {
    throw new Error(`Lead ${campaignLead.lead_id} not loaded`);
  }

  const outcome = await runWorkflow(
    parsedWorkflow,
    {
      supabase,
      campaign,
      campaignLead,
      lead: campaignLead.lead,
      productDescription,
      threadId: campaignLead.thread_id || undefined,
      replied: campaignLead.replied ?? false,
    },
    campaignHandlers,
    {
      startNodeId: campaignLead.current_node_id || parsedWorkflow.startNodeId,
    }
  );

  const lastActionTime = new Date().toISOString();

  if (outcome.status === "waiting") {
    await supabase
      .from("campaign_leads")
      .update({
        current_node_id: outcome.currentNodeId,
        status: "waiting",
        next_action_time: outcome.waitUntil,
        last_action_time: lastActionTime,
      })
      .eq("id", campaignLead.id);
    return outcome.steps;
  }

  const nextNode = parsedWorkflow.nodesById.get(outcome.currentNodeId);
  const completed =
    nextNode?.normalizedType === "end" ||
    !parsedWorkflow.outgoingBySource.get(outcome.currentNodeId)?.length;

  await supabase
    .from("campaign_leads")
    .update({
      current_node_id: outcome.currentNodeId,
      status: completed ? "completed" : "queued",
      next_action_time: completed ? null : new Date().toISOString(),
      last_action_time: lastActionTime,
    })
    .eq("id", campaignLead.id);

  return outcome.steps;
}

export async function processActiveCampaigns(): Promise<{
  processed: number;
  errors: number;
}> {
  const supabase = getSupabase();
  let processed = 0;
  let errors = 0;

  const { data: activeCampaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active");

  if (campaignError || !activeCampaigns?.length) {
    return { processed: 0, errors: 0 };
  }

  // Pre-fetch products to get descriptions
  const productIds = [...new Set((activeCampaigns as Campaign[]).map((c) => c.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, description")
    .in("id", productIds);
  const productDescriptionMap = new Map<string, string>(
    (products || []).map((p: { id: string; description: string | null }) => [p.id, p.description || ""])
  );

  for (const campaign of activeCampaigns as Campaign[]) {
    let parsedWorkflow: ParsedWorkflow;
    try {
      parsedWorkflow = parseWorkflow(campaign.workflow_json);
    } catch (error) {
      console.error(`Invalid workflow for campaign ${campaign.id}:`, error);
      errors++;
      continue;
    }

    const nowIso = new Date().toISOString();
    const productDescription = productDescriptionMap.get(campaign.product_id) || undefined;

    const { data: pendingLeads, error: leadsError } = await supabase
      .from("campaign_leads")
      .select("*, lead:leads(*)")
      .eq("campaign_id", campaign.id)
      .in("status", ["queued", "waiting"])
      .limit(200);

    if (leadsError || !pendingLeads?.length) {
      continue;
    }

    const dueLeads = (pendingLeads as CampaignLead[]).filter((lead) => {
      if (!lead.next_action_time) return true;
      return lead.next_action_time <= nowIso;
    });

    for (const campaignLead of dueLeads) {
      try {
        processed += await processCampaignLead(
          supabase,
          campaign,
          campaignLead,
          parsedWorkflow,
          productDescription
        );
      } catch (error) {
        console.error(`Error processing campaign_lead ${campaignLead.id}:`, error);
        await markFailed(
          supabase,
          campaignLead.id,
          error instanceof Error ? error.message : String(error)
        );
        errors++;
      }
    }
  }

  return { processed, errors };
}
