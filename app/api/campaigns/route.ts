import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const productId = request.nextUrl.searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/campaigns] Supabase error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json(
      { error: error.message || "Database query failed", code: error.code },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      product_id: body.product_id,
      name: body.name,
      workflow_json: body.workflow_json || { nodes: [], edges: [] },
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/campaigns] Supabase error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json(
      { error: error.message || "Failed to create campaign", code: error.code },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
