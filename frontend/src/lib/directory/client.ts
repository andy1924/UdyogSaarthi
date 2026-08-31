// Read-only directory lookup — mock profiles with ST_DWithin comment
// SELECT * FROM profiles WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lon,lat),4326)::geography, 10000)

export interface NearbyProfile {
  id: string;
  name: string;
  category: string;
  distanceM: number;
}

type ProfilePool = { id: string; name: string; category: string };

const POOL: ProfilePool[] = [
  { id: "p-hilsa-dairy-1", name: "Hilsa Dairy Collective", category: "dairy" },
  { id: "p-hilsa-retail-1", name: "Hilsa Kirana & General", category: "retail" },
  { id: "p-hilsa-dairy-2", name: "Nalanda Milk Chilling Centre", category: "dairy" },
  { id: "p-hilsa-retail-2", name: "Sunrise Tailors & Fabrics", category: "retail" },
  { id: "p-hilsa-handloom-1", name: "Bihar Handloom Kendra", category: "handloom" },
  { id: "p-hilsa-food-1", name: "Annapurna Food Stall", category: "retail" },
];

/**
 * Mock nearby profiles within radius.
 * Contract mirrors: SELECT * FROM profiles WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lon,lat),4326)::geography, 10000)
 * In production radiusM is the ST_DWithin distance in meters.
 */
export async function nearbyProfiles(
  lat: number,
  lon: number,
  radiusM: number,
  category?: string
): Promise<NearbyProfile[]> {
  // Keep async contract — simulate network
  await new Promise((r) => setTimeout(r, 280));

  const r = Math.max(0, Math.min(radiusM, 10000));

  // Filter by category if supplied (case-insensitive exact)
  let candidates = category
    ? POOL.filter((p) => p.category.toLowerCase() === category.trim().toLowerCase())
    : [...POOL];

  if (candidates.length === 0) return [];

  // Deterministic pseudo-distance derived from lat/lon so results feel anchored
  const seed = Math.abs(Math.floor(lat * 1000 + lon * 1000)) % 700;

  const withDistance: NearbyProfile[] = candidates.map((p, idx) => {
    // Spread distances 600m–~9500m within radius
    const base = 600 + idx * 1400 + (seed % 500);
    const distanceM = Math.min(base + idx * 137, r - 80 > 600 ? r - 80 : base);
    return { ...p, distanceM: Math.max(400, Math.round(distanceM)) };
  });

  // Only return those within radiusM
  const within = withDistance.filter((p) => p.distanceM <= r);

  // Mock 3–5 profiles: deterministic count 3..5 clamped to available
  const n = 3 + (Math.abs(Math.floor(lat * 100 + lon * 100)) % 3); // 3,4,5
  const sliced = within.slice(0, Math.min(n, within.length));

  // If radius very small (<1500) return at most 2 to show empty-ish
  if (r < 1500) return sliced.slice(0, Math.min(2, sliced.length));

  return sliced;
}
