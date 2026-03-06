// In-memory store for active visitors (resets on server restart)
// Maps visitor IP/id → { last seen timestamp, page, country }
// Use globalThis to persist across HMR in dev mode
type VisitorEntry = { ts: number; page: string; country: string };
const visitors: Map<string, VisitorEntry> =
  (globalThis as Record<string, unknown>).__onlineVisitors as Map<string, VisitorEntry> ??
  ((globalThis as Record<string, unknown>).__onlineVisitors = new Map<string, VisitorEntry>());
const TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function markOnline(id: string, page?: string, country?: string): void {
  const existing = visitors.get(id);
  visitors.set(id, { ts: Date.now(), page: page || "/", country: country || existing?.country || "" });
}

function cleanup() {
  const cutoff = Date.now() - TIMEOUT;
  for (const [key, v] of visitors) {
    if (v.ts < cutoff) visitors.delete(key);
  }
}

export function getOnlineCount(): number {
  cleanup();
  return visitors.size;
}

export function getOnlineCountries(): string[] {
  cleanup();
  const countries = new Set<string>();
  for (const [, v] of visitors) {
    if (v.country) countries.add(v.country);
  }
  return Array.from(countries);
}

export function getOnlineByPage(): { page: string; count: number }[] {
  cleanup();
  const counts = new Map<string, number>();
  for (const [, v] of visitors) {
    counts.set(v.page, (counts.get(v.page) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count);
}
