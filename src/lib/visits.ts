import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { withFileLock } from "./file-lock";

const DATA_DIR = path.join(process.cwd(), "data");
const VISITS_FILE = path.join(DATA_DIR, "visits.json");

// Storage format: { "2026-03-04T15": 5, "2026-03-04T16": 3, ... }
// Key = YYYY-MM-DDTHH (UTC hour)
export async function readVisits(): Promise<Record<string, number>> {
  try {
    const content = await readFile(VISITS_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export function incrementVisit(): Promise<void> {
  return withFileLock(VISITS_FILE, async () => {
    const visits = await readVisits();
    const now = new Date();
    const key = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-") + "T" + String(now.getHours()).padStart(2, "0");
    visits[key] = (visits[key] ?? 0) + 1;
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(VISITS_FILE, JSON.stringify(visits), "utf-8");
  });
}
