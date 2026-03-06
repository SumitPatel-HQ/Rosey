import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const productId = formData.get("productId") as string | null;

  if (!file || !productId) {
    return NextResponse.json(
      { error: "file and productId are required" },
      { status: 400 }
    );
  }

  const csvText = await file.text();

  let rows;
  try {
    rows = parseCsv(csvText);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse CSV" },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found in CSV" },
      { status: 400 }
    );
  }

  const leadsToInsert = rows.map((row) => ({
    product_id: productId,
    name: row.name.trim(),
    email: row.email.trim(),
    company: row.company?.trim() || null,
    industry: row.industry?.trim() || null,
    tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
  }));

  const { data, error } = await supabase
    .from("leads")
    .upsert(leadsToInsert, { onConflict: "product_id,email" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: data.length,
    total: rows.length,
  });
}
