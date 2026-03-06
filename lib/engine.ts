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

function getCampaignLabelName(productName: string, campaignName: string): string {
  return `${productName} - ${campaignName}`;
}

async function ensureCampaignLabel(
  supabase: ReturnType<typeof getSupabase>,
  campaign: Campaign,
  productName: string
): Promise<string | null> {
  const { getOrCreateLabel } = await import("@/lib/gmail");
  const labelName = getCampaignLabelName(productName, campaign.name);
  const labelId = await getOrCreateLabel(labelName);

  if (campaign.gmail_label_id !== labelId) {
    await supabase
      .from("campaigns")
      .update({ gmail_label_id: labelId })
      .eq("id", campaign.id);
    campaign.gmail_label_id = labelId;
  }

  return labelId;
}

async function claimCampaignLead(
  supabase: ReturnType<typeof getSupabase>,
  campaignLeadId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("campaign_leads")
    .update({
      status: "active",
      last_action_time: new Date().toISOString(),
    })
    .eq("id", campaignLeadId)
    .in("status", ["queued", "waiting"])
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.id);
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

function isMissingColumnError(error: unknown, columnName: string): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    ("message" in error && typeof error.message === "string" ? error.message : "") ||
    ("details" in error && typeof error.details === "string" ? error.details : "");
  return message.includes(columnName);
}

async function persistThreadState(
  supabase: ReturnType<typeof getSupabase>,
  campaignLeadId: string,
  values: {
    threadId: string;
    lastMessageId: string | undefined;
    threadSubject: string | undefined;
  }
) {
  const fullUpdate = {
    thread_id: values.threadId,
    last_message_id: values.lastMessageId || null,
    thread_subject: values.threadSubject || null,
  };

  const { error } = await supabase
    .from("campaign_leads")
    .update(fullUpdate)
    .eq("id", campaignLeadId);

  if (!error) return;

  if (
    isMissingColumnError(error, "last_message_id") ||
    isMissingColumnError(error, "thread_subject")
  ) {
    const fallback = await supabase
      .from("campaign_leads")
      .update({ thread_id: values.threadId })
      .eq("id", campaignLeadId);

    if (fallback.error) {
      throw fallback.error;
    }

    return;
  }

  throw error;
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

function getEmailPrompt(node: WorkflowNode): string {
  // New single-prompt field
  if (typeof node.data.prompt === "string" && node.data.prompt.trim()) {
    return node.data.prompt;
  }
  // Legacy fallback: combine old subject_prompt + body_prompt
  const parts = [
    typeof node.data.subject_prompt === "string" ? node.data.subject_prompt : "",
    typeof node.data.body_prompt === "string" ? node.data.body_prompt : "",
  ].filter(Boolean);
  if (parts.length) return parts.join(". ");
  // Last-resort fallback
  const template = typeof node.data.template === "string" ? node.data.template : "";
  return template ? `Write a ${template} outreach email` : "Write a professional outreach email";
}

interface CampaignExecutionContext {
  supabase: ReturnType<typeof getSupabase>;
  campaign: Campaign;
  campaignLead: CampaignLead;
  lead: Lead;
  productName: string;
  productDescription?: string;
  threadId?: string;
  lastMessageId?: string;
  threadSubject?: string;
  labelId?: string | null;
  replied: boolean;
}

const campaignHandlers: WorkflowHandlers<CampaignExecutionContext> = {
  start: async (node, context) => {
    await logAction(context.supabase, context.campaignLead.id, node.normalizedType, "success");
  },

  send_email: async (node, context) => {
    const prompt = getEmailPrompt(node);
    const mode =
      typeof node.data.mode === "string" && node.data.mode === "same_for_all"
        ? "same_for_all"
        : "personalized";

    let threadId = context.threadId;
    let threadSubject = context.threadSubject;
    let lastMessageId = context.lastMessageId;

    const { sendEmail, applyLabelToMessage, applyLabelToThread } = await import("@/lib/gmail");
    const { generateMessage } = await import("@/lib/openai");

    const interpolate = (text: string) =>
      text
        .replace(/\{\{name\}\}/g, context.lead.name)
        .replace(/\{\{email\}\}/g, context.lead.email)
        .replace(/\{\{company\}\}/g, context.lead.company || "your company")
        .replace(/\{\{industry\}\}/g, context.lead.industry || "your industry");

    let subject: string;
    let htmlBody: string;
    let cacheHit = false;

    if (mode === "same_for_all") {
      const cachedSubject =
        typeof node.data.cached_subject === "string" ? node.data.cached_subject : null;
      const cachedBody =
        typeof node.data.cached_body === "string" ? node.data.cached_body : null;

      if (cachedSubject && cachedBody) {
        // Cache hit — substitute placeholders for this specific lead
        cacheHit = true;
        subject = threadSubject || interpolate(cachedSubject);
        htmlBody = interpolate(cachedBody);
      } else {
        // Cache miss — generate once, then persist it back into workflow_json
        const message = await generateMessage(prompt, null, context.productDescription, {
          senderEmail: process.env.GMAIL_USER_EMAIL,
          isFollowUp: !!threadId,
        });

        // Mutate node.data in-memory so remaining leads in this batch skip generation
        node.data.cached_subject = message.subject;
        node.data.cached_body = message.body;

        // Persist the cache into campaign.workflow_json in Supabase
        const updatedNodes = context.campaign.workflow_json.nodes.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, cached_subject: message.subject, cached_body: message.body } }
            : n
        );
        const updatedWorkflow = { ...context.campaign.workflow_json, nodes: updatedNodes };
        await context.supabase
          .from("campaigns")
          .update({ workflow_json: updatedWorkflow })
          .eq("id", context.campaign.id);
        context.campaign.workflow_json = updatedWorkflow;

        subject = threadSubject || interpolate(message.subject);
        htmlBody = interpolate(message.body);
      }
    } else {
      // Personalized — unique email per lead
      const message = await generateMessage(prompt, context.lead, context.productDescription, {
        senderEmail: process.env.GMAIL_USER_EMAIL,
        isFollowUp: !!threadId,
      });
      subject = threadSubject || message.subject;
      htmlBody = message.body;
    }

    const sent = await sendEmail({
      to: context.lead.email,
      subject,
      htmlBody,
      threadId,
      replyToMessageId: lastMessageId,
    });

    threadId = sent.threadId;
    context.threadId = sent.threadId;
    threadSubject = subject;
    context.threadSubject = subject;
    lastMessageId = sent.rfcMessageId || lastMessageId;
    context.lastMessageId = lastMessageId;

    await persistThreadState(context.supabase, context.campaignLead.id, {
      threadId: sent.threadId,
      lastMessageId,
      threadSubject: subject,
    });

    if (context.labelId) {
      try {
        await applyLabelToThread(sent.threadId, context.labelId);
      } catch {
        await applyLabelToMessage(sent.messageId, context.labelId);
      }
    }

    await logAction(
      context.supabase,
      context.campaignLead.id,
      "send_email",
      "success",
      {
        mode,
        cache_hit: cacheHit,
        thread_subject: threadSubject,
        thread_id: threadId,
        last_message_id: lastMessageId,
        label_id: context.labelId,
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
    let replyCheckError: string | null = null;

    if (context.threadId) {
      try {
        const { hasThreadReceivedReply } = await import("@/lib/gmail");
        hasReply = await hasThreadReceivedReply(
          context.threadId,
          process.env.GMAIL_USER_EMAIL!
        );
      } catch (error) {
        hasReply = false;
        replyCheckError = error instanceof Error ? error.message : String(error);
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
      thread_id: context.threadId || null,
      reply_check_error: replyCheckError,
      missing_thread_id: !context.threadId,
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
  productName: string,
  labelId: string | null,
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
      productName,
      productDescription,
      labelId,
      threadId: campaignLead.thread_id || undefined,
      lastMessageId: campaignLead.last_message_id || undefined,
      threadSubject: campaignLead.thread_subject || undefined,
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

  // Pre-fetch products so campaigns can reuse product metadata per sweep.
  const productIds = [...new Set((activeCampaigns as Campaign[]).map((c) => c.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, name, description")
    .in("id", productIds);
  const productMap = new Map<
    string,
    { name: string; description: string | null }
  >(
    (products || []).map(
      (product: { id: string; name: string; description: string | null }) => [
        product.id,
        { name: product.name, description: product.description },
      ]
    )
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

    const product = productMap.get(campaign.product_id);
    if (!product) {
      console.error(`Missing product ${campaign.product_id} for campaign ${campaign.id}`);
      errors++;
      continue;
    }

    const productName = product.name;
    const productDescription = product.description || undefined;

    let labelId: string | null = null;
    try {
      labelId = await ensureCampaignLabel(supabase, campaign, productName);
    } catch (error) {
      console.error(`Failed to ensure label for campaign ${campaign.id}:`, error);
      errors++;
      continue;
    }

    while (true) {
      const nowIso = new Date().toISOString();
      const { data: dueLeads, error: leadsError } = await supabase
        .from("campaign_leads")
        .select("*, lead:leads(*)")
        .eq("campaign_id", campaign.id)
        .in("status", ["queued", "waiting"])
        .lte("next_action_time", nowIso)
        .order("next_action_time", { ascending: true })
        .limit(200);

      if (leadsError || !dueLeads?.length) {
        break;
      }

      for (const campaignLead of dueLeads as CampaignLead[]) {
        try {
          const claimed = await claimCampaignLead(supabase, campaignLead.id);
          if (!claimed) {
            continue;
          }

          processed += await processCampaignLead(
            supabase,
            campaign,
            campaignLead,
            parsedWorkflow,
            productName,
            labelId,
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

      if (dueLeads.length < 200) {
        break;
      }
    }

    const { data: remainingLeads } = await supabase
      .from("campaign_leads")
      .select("id")
      .eq("campaign_id", campaign.id)
      .in("status", ["queued", "waiting", "active"]);

    if (!remainingLeads?.length) {
      await supabase
        .from("campaigns")
        .update({ status: "completed" })
        .eq("id", campaign.id);
    }
  }

  return { processed, errors };
}
