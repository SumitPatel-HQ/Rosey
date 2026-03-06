import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, leads:leads(count), campaigns:campaigns(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const productData: Record<string, unknown> = {
    name: body.name,
    description: body.description || null,
    gmail_label_prefix: `NeuralNexus/${body.name}`,
  };

  // Auto-create Google Sheet + Drive folder if service account is configured
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const { createProductSheet } = await import("@/lib/sheets");
      const { sheetId, folderId } = await createProductSheet(body.name);
      productData.sheet_id = sheetId;
      productData.drive_folder_id = folderId;
    } catch (err) {
      console.warn("Sheets auto-creation failed (non-blocking):", err);
    }
  }

  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
