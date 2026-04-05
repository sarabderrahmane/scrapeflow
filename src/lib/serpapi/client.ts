const SERPAPI_BASE = "https://serpapi.com/search.json";

// Rotate through API keys when one is exhausted
function getApiKeys(): string[] {
  const keys = process.env.SERPAPI_KEYS?.split(",").map((k) => k.trim()) ?? [];
  if (keys.length === 0) throw new Error("No SERPAPI_KEYS configured");
  return keys;
}

async function fetchWithKeyRotation(
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const keys = getApiKeys();

  for (let i = 0; i < keys.length; i++) {
    const searchParams = new URLSearchParams({
      ...params,
      api_key: keys[i],
    });

    const res = await fetch(`${SERPAPI_BASE}?${searchParams.toString()}`);

    if (res.ok) {
      return res.json();
    }

    // If rate limited or quota exceeded, try next key
    if (res.status === 429 || res.status === 401) {
      console.warn(`SerpAPI key ${i + 1}/${keys.length} exhausted, trying next...`);
      continue;
    }

    const errorText = await res.text();
    throw new Error(`SerpAPI error (${res.status}): ${errorText}`);
  }

  throw new Error("All SerpAPI keys exhausted. Please wait or add more keys.");
}

function hasNextPage(data: Record<string, unknown>): boolean {
  // SerpAPI returns serpapi_pagination.next when more results exist
  const pagination = data.serpapi_pagination as Record<string, unknown> | undefined;
  if (pagination?.next) return true;
  // Also check for next page token in search_information
  const searchInfo = data.search_information as Record<string, unknown> | undefined;
  if (searchInfo?.next_page_token) return true;
  return false;
}

// Google Search: paginate with num=100 and start offset, up to 1000 results
export async function searchGoogle(params: {
  query: string;
  country: string;
  language: string;
}): Promise<Record<string, unknown>[]> {
  const allPages: Record<string, unknown>[] = [];
  const maxPages = 10;

  for (let page = 0; page < maxPages; page++) {
    const data = await fetchWithKeyRotation({
      engine: "google",
      q: params.query,
      gl: params.country,
      hl: params.language,
      num: "100",
      start: String(page * 100),
    });

    const organicResults = data.organic_results as unknown[] | undefined;
    if (!organicResults || organicResults.length === 0) break;

    allPages.push(data);

    // Stop if SerpAPI says no next page
    if (!hasNextPage(data)) break;
  }

  return allPages;
}

// Google Maps: paginate using SerpAPI pagination, up to 1000 results
export async function searchGoogleMaps(params: {
  query: string;
  country: string;
  language: string;
}): Promise<Record<string, unknown>[]> {
  const allPages: Record<string, unknown>[] = [];
  const maxPages = 50;

  for (let page = 0; page < maxPages; page++) {
    const data = await fetchWithKeyRotation({
      engine: "google_maps",
      q: params.query,
      gl: params.country,
      hl: params.language,
      start: String(page * 20),
    });

    const localResults = data.local_results as unknown[] | undefined;
    if (!localResults || localResults.length === 0) break;

    allPages.push(data);

    // Stop if SerpAPI says no next page
    if (!hasNextPage(data)) break;
  }

  return allPages;
}
