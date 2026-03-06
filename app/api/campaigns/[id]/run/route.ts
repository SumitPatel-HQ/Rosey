import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign, error: fetchErr } = await supabase
    .from("campaigns")
    .select("*, product:products(*)")
    .eq("id", id)
    .single();

  if (fetchErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status === "active") {
    return NextResponse.json({ error: "Campaign is already active" }, { status: 400 });
  }

  // Verify workflow has at least a start and end node
  const nodes = campaign.workflow_json?.nodes || [];
  const hasStart = nodes.some((n: { type: string }) => n.type === "start");
  const hasEnd = nodes.some((n: { type: string }) => n.type === "end");
  if (!hasStart || !hasEnd) {
    return NextResponse.json(
      { error: "Workflow must have at least a Start and End node" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("campaigns")
    .update({ status: "active" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
