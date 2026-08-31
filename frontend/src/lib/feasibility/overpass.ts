/**
 * Overpass adapter — mock, contract-typed.
 *
 * Contract QL (for real Overpass API):
 * ```
 * [out:json][timeout:25];
 * node["shop"="electronics"](around:5000,lat,lon);
 * out body;
 * ```
 * Partition key = LGD block/district (cached server-side with PostGIS ST_DWithin).
 * This mock returns deterministic count 12..45 and synthetic POI dots around center.
 */

export interface POI {
  lat: number;
  lon: number;
}

export interface POIResult {
  count: number;
  pois: POI[];
}

/**
 * Query POIs within radius around lat/lon for shopType.
 * Mock: count = 12 + hash(lat,lon,shopType) % 34  => 12..45
 * pois are jittered within radius for map display.
 */
export async function queryPOI(
  lat: number,
  lon: number,
  radiusM: number,
  shopType: string
): Promise<POIResult> {
  // Overpass QL contract comment — kept as runtime reference too
  // node["shop"="electronics"](around:5000,lat,lon);
  // Real query would be: `[out:json];node["shop"="${shopType}"](around:${radiusM},${lat},${lon});out body;`

  await new Promise<void>((r) => setTimeout(r, 700));

  // deterministic pseudo-hash from inputs
  const s = `${lat.toFixed(4)}|${lon.toFixed(4)}|${radiusM}|${shopType.toLowerCase()}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  const count = 12 + (h % 34); // 12..45

  // generate POIs jittered within radius (approx degrees: 1deg ~111km)
  const pois: POI[] = [];
  const radiusDeg = radiusM / 111000;
  // seed PRNG from h
  let seed = h;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const angle = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * radiusDeg; // uniform in circle
    pois.push({
      lat: lat + r * Math.cos(angle),
      lon: lon + r * Math.sin(angle),
    });
  }

  return { count, pois };
}
