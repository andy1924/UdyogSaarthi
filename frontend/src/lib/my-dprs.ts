export interface MyDprEntry {
  id: string;
  businessName: string;
  createdAt: string;
}

const REGISTRY_KEY = 'saarthi-my-dprs';

export function listMyDprs(): MyDprEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is MyDprEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as MyDprEntry).id === 'string' &&
        typeof (entry as MyDprEntry).businessName === 'string',
    );
  } catch {
    return [];
  }
}
function saveMyDprs(entries: MyDprEntry[]): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(entries));
  } catch {
    /* Registry is best-effort. */
  }
}

export function pushMyDpr(entry: MyDprEntry): void {
  const existing = listMyDprs().filter((item) => item.id !== entry.id);
  saveMyDprs([entry, ...existing]);
}

export function removeMyDpr(id: string): void {
  saveMyDprs(listMyDprs().filter((item) => item.id !== id));
}

export function clearMyDprs(): void {
  saveMyDprs([]);
}
