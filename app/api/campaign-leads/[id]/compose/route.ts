import { createClient } from "@/lib/supabase/server";
import { generateMessage } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();
  const prompt: string = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: campaignLead, error: clError } = await supabase
    .from("campaign_leads")
    .select("*, lead:leads(*), campaign:campaigns(*, product:products(*))")
    .eq("id", id)
    .single();

  if (clError || !campaignLead) {
    return NextResponse.json({ error: "Campaign lead not found" }, { status: 404 });
  }

  const lead = campaignLead.lead;
  const product = campaignLead.campaign?.product;

  try {
    const { subject, body: emailBody } = await generateMessage(
      prompt,
      lead ?? null,
      product?.description ?? undefined,
      {
        senderEmail: process.env.GMAIL_USER_EMAIL,
        isFollowUp: Boolean(campaignLead.thread_id),
      }
    );

    return NextResponse.json({ subject, body: emailBody });
  } catch (err) {
    console.error("AI compose failed:", err);
    return NextResponse.json(
      { error: "Failed to generate email draft" },
      { status: 500 }
    );
  }
}
