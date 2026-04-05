import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const { queryId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  // Get the query
  const { data: query } = await supabase
    .from("search_queries")
    .select("*")
    .eq("id", queryId)
    .single();

  if (!query) {
    return NextResponse.json({ error: "Query introuvable" }, { status: 404 });
  }

  const table =
    query.search_type === "serp" ? "serp_results" : "maps_results";
  const { data: results } = await supabase
    .from(table)
    .select("*")
    .eq("query_id", queryId)
    .order("position", { ascending: true });

  if (!results || results.length === 0) {
    return new Response("Aucun resultat", { status: 404 });
  }

  // Build CSV
  const headers = Object.keys(results[0]).filter(
    (k) => k !== "id" && k !== "query_id" && k !== "created_at"
  );
  const csvRows = [
    headers.join(","),
    ...results.map((row) =>
      headers.map((h) => escapeCsv(row[h])).join(",")
    ),
  ];
  const csv = csvRows.join("\n");

  const filename = `${query.search_type}-${query.query_text.replace(/\s+/g, "_")}-${query.country}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
