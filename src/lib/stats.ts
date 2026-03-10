import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { withFileLock } from "./file-lock";

const DATA_DIR = path.join(process.cwd(), "data");
const STATS_FILE = path.join(DATA_DIR, "stats.json");

type ViewEntry = { id: string; at: string };
// artworkId -> array of viewer entries (or legacy string IDs)
type Stats = Record<string, Array<string | ViewEntry>>;

function normalize(v: string | ViewEntry): ViewEntry {
  return typeof v === "string" ? { id: v, at: new Date().toISOString() } : v;
}

export async function readStats(): Promise<Stats> {
  try {
    const content = await readFile(STATS_FILE, "utf-8");
    const raw = JSON.parse(content) as Stats;
    // Migrate legacy string entries to ViewEntry objects
    const needsMigration = Object.values(raw).some((arr) =>
      arr.some((v) => typeof v === "string")
    );
    if (needsMigration) {
      const migrated: Stats = Object.fromEntries(
        Object.entries(raw).map(([id, arr]) => [id, arr.map(normalize)])
      );
      await writeStats(migrated);
      return migrated;
    }
    return raw;
  } catch {
    return {};
  }
}

export async function writeStats(stats: Stats): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
}

export function recordView(artworkId: string, visitorId: string): Promise<void> {
  return withFileLock(STATS_FILE, async () => {
    const stats = await readStats();
    const entries = (stats[artworkId] ?? []).map(normalize);
    if (!entries.some((v) => v.id === visitorId)) {
      entries.push({ id: visitorId, at: new Date().toISOString() });
      stats[artworkId] = entries;
      await writeStats(stats);
    }
  });
}

export function getViewCounts(
  stats: Stats
): Record<string, { total: number; recent: number }> {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Object.fromEntries(
    Object.entries(stats).map(([id, raw]) => {
      const entries = raw.map(normalize);
      return [
        id,
        {
          total: entries.length,
          recent: entries.filter((v) => now - new Date(v.at).getTime() < DAY_MS).length,
        },
      ];
    })
  );
}
