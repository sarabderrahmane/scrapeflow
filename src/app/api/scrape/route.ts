import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchGoogle, searchGoogleMaps } from "@/lib/serpapi/client";
import { parseSerpResults } from "@/lib/serpapi/parse-serp";
import { parseMapsResults } from "@/lib/serpapi/parse-maps";
import { z } from "zod";

const scrapeSchema = z.object({
  projectId: z.string().uuid(),
  keywords: z.array(z.string().min(1)).min(1).max(10),
  searchType: z.enum(["serp", "maps"]),
  country: z.string().min(2).max(5),
  language: z.string().min(2).max(5),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = scrapeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Donnees invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { projectId, keywords, searchType, country, language } = parsed.data;

  // Check user is owner/editor
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role === "viewer") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const results = [];

  for (const keyword of keywords) {
    // Create search query record
    const { data: query, error: queryError } = await supabase
      .from("search_queries")
      .insert({
        project_id: projectId,
        query_text: keyword,
        search_type: searchType,
        country,
        language,
        status: "processing",
        created_by: user.id,
      })
      .select()
      .single();

    if (queryError || !query) {
      results.push({ keyword, status: "failed", error: queryError?.message });
      continue;
    }

    try {
      let resultCount = 0;

      if (searchType === "serp") {
        const rawData = await searchGoogle({ query: keyword, country, language });
        const parsed = parseSerpResults(rawData);
        resultCount = parsed.length;

        if (parsed.length > 0) {
          await supabase.from("serp_results").insert(
            parsed.map((r) => ({
              query_id: query.id,
              ...r,
            }))
          );
        }
      } else {
        const rawData = await searchGoogleMaps({ query: keyword, country, language });
        const parsed = parseMapsResults(rawData);
        resultCount = parsed.length;

        if (parsed.length > 0) {
          await supabase.from("maps_results").insert(
            parsed.map((r) => ({
              query_id: query.id,
              ...r,
            }))
          );
        }
      }

      await supabase
        .from("search_queries")
        .update({ status: "completed", results_count: resultCount })
        .eq("id", query.id);

      results.push({
        keyword,
        queryId: query.id,
        status: "completed",
        resultsCount: resultCount,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      await supabase
        .from("search_queries")
        .update({ status: "failed", error_message: errorMessage })
        .eq("id", query.id);

      results.push({ keyword, queryId: query.id, status: "failed", error: errorMessage });
    }
  }

  return NextResponse.json({ results });
}
