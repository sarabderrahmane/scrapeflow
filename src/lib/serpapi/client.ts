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

export async function searchGoogle(params: {
  query: string;
  country: string;
  language: string;
}) {
  return fetchWithKeyRotation({
    engine: "google",
    q: params.query,
    gl: params.country,
    hl: params.language,
    num: "20",
  });
}

export async function searchGoogleMaps(params: {
  query: string;
  country: string;
  language: string;
}) {
  return fetchWithKeyRotation({
    engine: "google_maps",
    q: params.query,
    gl: params.country,
    hl: params.language,
  });
}
