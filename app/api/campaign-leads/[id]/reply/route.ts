import { createClient } from "@/lib/supabase/server";
import { sendEmail, applyLabelToThread } from "@/lib/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();
  const subject: string = body.subject?.trim();
  const htmlBody: string = body.htmlBody?.trim();

  if (!subject || !htmlBody) {
    return NextResponse.json(
      { error: "subject and htmlBody are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: campaignLead, error: clError } = await supabase
    .from("campaign_leads")
    .select("*, lead:leads(*), campaign:campaigns(*)")
    .eq("id", id)
    .single();

  if (clError || !campaignLead) {
    return NextResponse.json({ error: "Campaign lead not found" }, { status: 404 });
  }

  const lead = campaignLead.lead;
  const campaign = campaignLead.campaign;

  if (!lead?.email) {
    return NextResponse.json({ error: "Lead email not found" }, { status: 400 });
  }

  try {
    const { messageId, threadId, rfcMessageId } = await sendEmail({
      to: lead.email,
      subject,
      htmlBody,
      threadId: campaignLead.thread_id ?? undefined,
      replyToMessageId: campaignLead.last_message_id ?? undefined,
    });

    // Persist thread state back to DB
    await supabase
      .from("campaign_leads")
      .update({
        thread_id: threadId,
        last_message_id: rfcMessageId || messageId,
        thread_subject: campaignLead.thread_subject || subject,
      })
      .eq("id", id);

    // Apply campaign label to thread if available
    if (campaign?.gmail_label_id) {
      try {
        await applyLabelToThread(threadId, campaign.gmail_label_id);
      } catch {
        // Non-fatal — label application failure shouldn't block the reply
      }
    }

    // Log the manual send
    await supabase.from("logs").insert({
      campaign_lead_id: id,
      action: "manual_reply",
      status: "success",
      metadata: {
        thread_id: threadId,
        message_id: messageId,
        subject,
      },
    });

    return NextResponse.json({ messageId, threadId });
  } catch (err) {
    console.error("Manual reply failed:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
