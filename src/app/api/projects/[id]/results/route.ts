import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get("queryId");
  const searchType = searchParams.get("searchType");

  // Get search queries for this project
  let queriesQuery = supabase
    .from("search_queries")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (searchType) {
    queriesQuery = queriesQuery.eq("search_type", searchType);
  }

  const { data: queries, error: queriesError } = await queriesQuery;

  if (queriesError) {
    return NextResponse.json({ error: queriesError.message }, { status: 500 });
  }

  // If queryId specified, get results for that specific query
  if (queryId) {
    const query = queries?.find((q) => q.id === queryId);
    if (!query) {
      return NextResponse.json({ error: "Query introuvable" }, { status: 404 });
    }

    const table = query.search_type === "serp" ? "serp_results" : "maps_results";
    const { data: results, error } = await supabase
      .from(table)
      .select("*")
      .eq("query_id", queryId)
      .order("position", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ query, results });
  }

  return NextResponse.json({ queries });
}
