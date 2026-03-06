// In-memory store for active visitors (resets on server restart)
// Maps visitor IP/id → { last seen timestamp, page }
const visitors = new Map<string, { ts: number; page: string }>();
const TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function markOnline(id: string, page?: string): void {
  visitors.set(id, { ts: Date.now(), page: page || "/" });
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
