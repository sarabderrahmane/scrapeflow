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
      });
    }
  }

  return allResults;
}
