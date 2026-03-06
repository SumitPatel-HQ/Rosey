import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
import { NextRequest, NextResponse } from "next/server";

interface JsonLeadRow {
  name: string;
  email: string;
  company?: string;
  industry?: string;
  tags?: string | string[];
}

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

  const fileText = await file.text();
  const isJson = file.name.toLowerCase().endsWith(".json") ||
    file.type === "application/json";

  let leadsToInsert: { product_id: string; name: string; email: string; company: string | null; industry: string | null; tags: string[] }[];

  if (isJson) {
    let parsed: JsonLeadRow[];
    try {
      const raw = JSON.parse(fileText);
      parsed = Array.isArray(raw) ? raw : [raw];
    } catch {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
    }
    if (parsed.length === 0) {
      return NextResponse.json({ error: "No valid rows found in JSON" }, { status: 400 });
    }
    leadsToInsert = parsed.map((row) => ({
      product_id: productId,
      name: String(row.name || "").trim(),
      email: String(row.email || "").trim(),
      company: row.company ? String(row.company).trim() : null,
      industry: row.industry ? String(row.industry).trim() : null,
      tags: Array.isArray(row.tags)
        ? row.tags.map(String).filter(Boolean)
        : row.tags
        ? String(row.tags).split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    })).filter((r) => r.name && r.email);
  } else {
    let rows;
    try {
      rows = parseCsv(fileText);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to parse CSV" },
        { status: 400 }
      );
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
    }
    leadsToInsert = rows.map((row) => ({
      product_id: productId,
      name: row.name.trim(),
      email: row.email.trim(),
      company: row.company?.trim() || null,
      industry: row.industry?.trim() || null,
      tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    }));
  }

  const { data, error } = await supabase
    .from("leads")
    .upsert(leadsToInsert, { onConflict: "product_id,email" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: data.length,
    total: leadsToInsert.length,
    ids: data.map((r: { id: string }) => r.id),
  });
}

