import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { withFileLock } from "./file-lock";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "social-clicks.json");

type ClickEntry = { at: string };
type ClickData = Record<string, ClickEntry[]>;

export async function readSocialClicks(): Promise<ClickData> {
  try {
    const content = await readFile(FILE, "utf-8");
    return JSON.parse(content) as ClickData;
  } catch {
    return {};
  }
}

export async function writeSocialClicks(data: ClickData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function recordSocialClick(name: string): Promise<void> {
  return withFileLock(FILE, async () => {
    const data = await readSocialClicks();
    const entries = data[name] ?? [];
    entries.push({ at: new Date().toISOString() });
    data[name] = entries;
    await writeSocialClicks(data);
  });
}

export function getSocialClickCounts(
  data: ClickData
): Record<string, { total: number; recent: number }> {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Object.fromEntries(
    Object.entries(data).map(([name, entries]) => [
      name,
      {
        total: entries.length,
        recent: entries.filter((e) => now - new Date(e.at).getTime() < DAY_MS).length,
      },
    ])
  );
}
