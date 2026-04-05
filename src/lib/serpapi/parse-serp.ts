export interface SerpResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  domain: string;
  displayed_link: string;
}

export function parseSerpResults(data: Record<string, unknown>): SerpResult[] {
  const organicResults = (data.organic_results as Array<Record<string, unknown>>) ?? [];

  return organicResults.map((result, index) => {
    const link = (result.link as string) ?? "";
    let domain = "";
    try {
      domain = new URL(link).hostname.replace("www.", "");
    } catch {
      domain = (result.displayed_link as string) ?? "";
    }

    return {
      position: (result.position as number) ?? index + 1,
      title: (result.title as string) ?? "",
      link,
      snippet: (result.snippet as string) ?? "",
      domain,
      displayed_link: (result.displayed_link as string) ?? "",
    };
  });
}
