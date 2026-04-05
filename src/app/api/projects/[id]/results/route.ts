import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function DELETE(
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
  const resultId = searchParams.get("resultId");
  const type = searchParams.get("type"); // "serp" or "maps"

  if (!resultId || !type) {
    return NextResponse.json({ error: "resultId et type requis" }, { status: 400 });
  }

  // Verify user is editor/owner of this project
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role === "viewer") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const table = type === "serp" ? "serp_results" : "maps_results";
  const admin = createAdminClient();
  const { error } = await admin.from(table).delete().eq("id", resultId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
