export interface MapsResult {
  position: number;
  title: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviews_count: number | null;
  website: string | null;
  category: string | null;
  place_id: string | null;
  thumbnail: string | null;
  latitude: number | null;
  longitude: number | null;
  instagram: string | null;
}

function extractInstagram(result: Record<string, unknown>): string | null {
  // Check in links array (SerpAPI sometimes includes social links)
  const links = result.links as Array<Record<string, string>> | undefined;
  if (links) {
    for (const link of links) {
      const url = link.link || link.url || "";
      if (url.includes("instagram.com")) return url;
    }
  }

  // Check in social_links
  const socialLinks = result.social_links as Record<string, string> | undefined;
  if (socialLinks?.instagram) return socialLinks.instagram;

  // Check in profiles
  const profiles = result.profiles as Array<Record<string, string>> | undefined;
  if (profiles) {
    for (const p of profiles) {
      const url = p.link || p.url || "";
      if (url.includes("instagram.com")) return url;
    }
  }

  // Scan all string values for instagram.com URLs
  for (const value of Object.values(result)) {
    if (typeof value === "string" && value.includes("instagram.com/")) {
      return value;
    }
    // Check nested objects/arrays
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.includes("instagram.com/")) return item;
        if (typeof item === "object" && item !== null) {
          for (const v of Object.values(item as Record<string, unknown>)) {
            if (typeof v === "string" && v.includes("instagram.com/")) return v;
          }
        }
      }
    }
  }

  return null;
}

export function parseMapsResults(pages: Record<string, unknown>[]): MapsResult[] {
  const allResults: MapsResult[] = [];

  for (const data of pages) {
    const localResults = (data.local_results as Array<Record<string, unknown>>) ?? [];

    for (const result of localResults) {
      const gps = result.gps_coordinates as Record<string, number> | undefined;

      allResults.push({
        position: (result.position as number) ?? allResults.length + 1,
        title: (result.title as string) ?? "",
        address: (result.address as string) ?? "",
        phone: (result.phone as string) ?? null,
        rating: (result.rating as number) ?? null,
        reviews_count: (result.reviews as number) ?? null,
        website: (result.website as string) ?? null,
        category: (result.type as string) ?? null,
        place_id: (result.place_id as string) ?? null,
        thumbnail: (result.thumbnail as string) ?? null,
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
        instagram: extractInstagram(result),
      });
    }
  }

  return allResults;
}
