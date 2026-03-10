// In-memory store for active visitors (resets on server restart)
// Maps visitor IP/id → { last seen timestamp, page, country }
// Use globalThis to persist across HMR in dev mode
type VisitorEntry = { ts: number; page: string; country: string };
const visitors: Map<string, VisitorEntry> =
  (globalThis as Record<string, unknown>).__onlineVisitors as Map<string, VisitorEntry> ??
  ((globalThis as Record<string, unknown>).__onlineVisitors = new Map<string, VisitorEntry>());
const TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_VISITORS = 10_000; // Safety cap
const RATE_LIMIT_MS = 10_000; // Min 10s between heartbeats per IP

export function markOnline(id: string, page?: string, country?: string): boolean {
  const now = Date.now();
  const existing = visitors.get(id);

  // Rate limit: skip if last heartbeat was less than 10s ago
  if (existing && now - existing.ts < RATE_LIMIT_MS) return false;

  // Safety cap: don't grow unbounded
  if (!existing && visitors.size >= MAX_VISITORS) {
    cleanup();
    if (visitors.size >= MAX_VISITORS) return false;
  }

  visitors.set(id, { ts: now, page: page || "/", country: country || existing?.country || "" });
  return true;
}

function cleanup() {
  const cutoff = Date.now() - TIMEOUT;
  for (const [key, v] of visitors) {
    if (v.ts < cutoff) visitors.delete(key);
  }
}

// Periodic cleanup instead of only on-read
const cleanupTimer = (globalThis as Record<string, unknown>).__onlineCleanupTimer as ReturnType<typeof setInterval> | undefined;
if (!cleanupTimer) {
  (globalThis as Record<string, unknown>).__onlineCleanupTimer = setInterval(cleanup, 60_000);
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
