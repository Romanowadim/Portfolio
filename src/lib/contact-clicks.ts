import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CLICKS_FILE = path.join(DATA_DIR, "contact-clicks.json");

type ClickEntry = { at: string };
type ClickData = Record<string, ClickEntry[]>;

export async function readContactClicks(): Promise<ClickData> {
  try {
    const content = await readFile(CLICKS_FILE, "utf-8");
    return JSON.parse(content) as ClickData;
  } catch {
    return {};
  }
}

export async function writeContactClicks(data: ClickData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CLICKS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function recordContactClick(id: string): Promise<void> {
  const data = await readContactClicks();
  const entries = data[id] ?? [];
  entries.push({ at: new Date().toISOString() });
  data[id] = entries;
  await writeContactClicks(data);
}

export function getContactClickCounts(
  data: ClickData
): Record<string, { total: number; recent: number }> {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Object.fromEntries(
    Object.entries(data).map(([id, entries]) => [
      id,
      {
        total: entries.length,
        recent: entries.filter((e) => now - new Date(e.at).getTime() < DAY_MS).length,
      },
    ])
  );
}
