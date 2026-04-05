export interface SerpResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  domain: string;
  displayed_link: string;
}

export function parseSerpResults(pages: Record<string, unknown>[]): SerpResult[] {
  const allResults: SerpResult[] = [];

  for (const data of pages) {
    const organicResults = (data.organic_results as Array<Record<string, unknown>>) ?? [];

    for (const result of organicResults) {
      const link = (result.link as string) ?? "";
      let domain = "";
      try {
        domain = new URL(link).hostname.replace("www.", "");
      } catch {
        domain = (result.displayed_link as string) ?? "";
      }

      allResults.push({
        position: (result.position as number) ?? allResults.length + 1,
        title: (result.title as string) ?? "",
        link,
        snippet: (result.snippet as string) ?? "",
        domain,
        displayed_link: (result.displayed_link as string) ?? "",
      });
    }
  }

  return allResults;
}
