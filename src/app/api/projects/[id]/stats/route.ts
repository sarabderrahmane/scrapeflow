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

  // Get all queries for this project
  const { data: queries } = await supabase
    .from("search_queries")
    .select("*")
    .eq("project_id", projectId);

  const totalSearches = queries?.length ?? 0;
  const serpQueries = queries?.filter((q) => q.search_type === "serp") ?? [];
  const mapsQueries = queries?.filter((q) => q.search_type === "maps") ?? [];

  const serpQueryIds = serpQueries.map((q) => q.id);
  const mapsQueryIds = mapsQueries.map((q) => q.id);

  // Get SERP results
  let serpStats = {
    totalResults: 0,
    avgPosition: 0,
    topDomains: [] as { domain: string; count: number }[],
  };

  if (serpQueryIds.length > 0) {
    const { data: serpResults } = await supabase
      .from("serp_results")
      .select("*")
      .in("query_id", serpQueryIds);

    if (serpResults && serpResults.length > 0) {
      serpStats.totalResults = serpResults.length;
      serpStats.avgPosition =
        Math.round(
          (serpResults.reduce((sum, r) => sum + (r.position ?? 0), 0) /
            serpResults.length) *
            10
        ) / 10;

      const domainCounts: Record<string, number> = {};
      serpResults.forEach((r) => {
        if (r.domain) {
          domainCounts[r.domain] = (domainCounts[r.domain] ?? 0) + 1;
        }
      });
      serpStats.topDomains = Object.entries(domainCounts)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  }

  // Get Maps results
  let mapsStats = {
    totalResults: 0,
    avgRating: 0,
    noWebsiteCount: 0,
    noWebsitePercent: 0,
    topCategories: [] as { category: string; count: number }[],
  };

  if (mapsQueryIds.length > 0) {
    const { data: mapsResults } = await supabase
      .from("maps_results")
      .select("*")
      .in("query_id", mapsQueryIds);

    if (mapsResults && mapsResults.length > 0) {
      mapsStats.totalResults = mapsResults.length;

      const withRating = mapsResults.filter((r) => r.rating !== null);
      mapsStats.avgRating =
        withRating.length > 0
          ? Math.round(
              (withRating.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
                withRating.length) *
                10
            ) / 10
          : 0;

      mapsStats.noWebsiteCount = mapsResults.filter(
        (r) => !r.website
      ).length;
      mapsStats.noWebsitePercent = Math.round(
        (mapsStats.noWebsiteCount / mapsResults.length) * 100
      );

      const catCounts: Record<string, number> = {};
      mapsResults.forEach((r) => {
        if (r.category) {
          catCounts[r.category] = (catCounts[r.category] ?? 0) + 1;
        }
      });
      mapsStats.topCategories = Object.entries(catCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  }

  return NextResponse.json({
    totalSearches,
    serpSearches: serpQueries.length,
    mapsSearches: mapsQueries.length,
    serp: serpStats,
    maps: mapsStats,
  });
}
