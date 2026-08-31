/**
 * LGD resolver — mock, contract-typed.
 * Partition key = LGD block/district (per spec OSM/LGD contract).
 */

export interface LGDCode {
  state: string;
  district: string;
  block: string;
  gp: string;
  code: string;
}

// Mock LGD directory — extend as needed; real impl swaps with API + Redis cache.
const MOCK_DIRECTORY: Record<string, LGDCode> = {
  hilsa: { state: "Bihar", district: "Nalanda", block: "Hilsa", gp: "Hilsa", code: "BR-NA-HI-001" },
  // additional seeds for demo variety
  patna: { state: "Bihar", district: "Patna", block: "Patna Sadar", gp: "Patna", code: "BR-PA-PS-002" },
  gaya: { state: "Bihar", district: "Gaya", block: "Gaya Sadar", gp: "Gaya", code: "BR-GA-GS-003" },
  rajgir: { state: "Bihar", district: "Nalanda", block: "Rajgir", gp: "Rajgir", code: "BR-NA-RJ-004" },
  islampur: { state: "Bihar", district: "Nalanda", block: "Islampur", gp: "Islampur", code: "BR-NA-IS-005" },
};

const FALLBACK_LGD: LGDCode = {
  state: "Bihar",
  district: "Nalanda",
  block: "Hilsa",
  gp: "Hilsa",
  code: "BR-NA-HI-000",
};

/**
 * Resolve free-text input to an LGDCode.
 * Mock mapping: any input containing "hilsa" (case-insensitive) → Bihar/Nalanda/Hilsa.
 * Falls back to Hilsa if unknown. Simulates network latency 300ms.
 */
export async function resolveLGD(input: string): Promise<LGDCode> {
  const key = input.trim().toLowerCase();
  await new Promise<void>((r) => setTimeout(r, 300));
  if (!key) return { ...FALLBACK_LGD };
  // direct match
  if (MOCK_DIRECTORY[key]) return { ...MOCK_DIRECTORY[key] };
  // substring match
  for (const k of Object.keys(MOCK_DIRECTORY)) {
    if (key.includes(k)) return { ...MOCK_DIRECTORY[k] };
  }
  // fallback: echo first token as block if plausible, else default
  const first = key.split(/[,/-]/)[0]?.trim();
  if (first && first.length >= 3 && first.length <= 32 && /^[a-z\s]+$/.test(first)) {
    const cap = first
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { state: "Bihar", district: "Nalanda", block: cap, gp: cap, code: `BR-NA-${cap.slice(0, 2).toUpperCase()}-000` };
  }
  return { ...FALLBACK_LGD };
}

/** List all seeded LGDs — for autocomplete / directory peers */
export function listLGD(): LGDCode[] {
  return Object.values(MOCK_DIRECTORY).map((v) => ({ ...v }));
}

/** Get LGD suggestions matching prefix (case-insensitive) */
export function suggestLGD(prefix: string, limit = 5): LGDCode[] {
  const q = prefix.trim().toLowerCase();
  if (!q) return listLGD().slice(0, limit);
  return listLGD()
    .filter(
      (c) =>
        c.block.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.gp.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
