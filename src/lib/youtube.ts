export function extractChannel(url: string): { type: "id" | "handle"; value: string } | null {
  const trimmed = url.trim();
  // Bare @handle
  if (trimmed.startsWith("@")) return { type: "handle", value: trimmed.slice(1) };
  // Bare channel ID
  if (/^UC[\w-]{20,}$/.test(trimmed)) return { type: "id", value: trimmed };
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const path = u.pathname;
    const channelMatch = path.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) return { type: "id", value: channelMatch[1] };
    const handleMatch = path.match(/\/@([\w.-]+)/);
    if (handleMatch) return { type: "handle", value: handleMatch[1] };
    // /c/CustomName or /user/Username
    const customMatch = path.match(/\/(?:c|user)\/([\w.-]+)/);
    if (customMatch) return { type: "handle", value: customMatch[1] };
    // Bare /Username (single path segment, not a known route)
    const bareMatch = path.match(/^\/([\w.-]{2,})$/);
    if (bareMatch && !["feed", "watch", "playlist", "shorts", "live", "results", "premium", "gaming"].includes(bareMatch[1])) {
      return { type: "handle", value: bareMatch[1] };
    }
    return null;
  } catch {
    return null;
  }
}

export function format(count: number): string {
  if (count >= 1_000_000) return `${+(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${+(count / 1_000).toFixed(1)}K`;
  return count.toString();
}
