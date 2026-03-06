// In-memory store for active visitors (resets on server restart)
// Maps visitor IP/id → last seen timestamp
const visitors = new Map<string, number>();
const TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function markOnline(id: string): void {
  visitors.set(id, Date.now());
}

export function getOnlineCount(): number {
  const cutoff = Date.now() - TIMEOUT;
  let count = 0;
  for (const [key, ts] of visitors) {
    if (ts < cutoff) visitors.delete(key);
    else count++;
  }
  return count;
}
