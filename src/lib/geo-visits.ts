import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "geo-visits.json");

// Storage: { "2026-03-04T15": { "US": 2, "RU": 5 }, ... }
// Key = YYYY-MM-DDTHH (UTC hour)
type GeoStore = Record<string, Record<string, number>>;

async function readStore(): Promise<GeoStore> {
  try {
    const raw = JSON.parse(await readFile(FILE, "utf-8"));
    // Migrate from old flat format { "US": 15, "RU": 42 }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const firstVal = Object.values(raw)[0];
      if (typeof firstVal === "number") {
        // Old format — wrap into a single "legacy" bucket
        return { "2026-01-01T00": raw as Record<string, number> };
      }
    }
    return raw;
  } catch {
    return {};
  }
}

export type GeoPeriod = "all" | "year" | "month" | "week" | "day";

export async function readGeoVisits(period: GeoPeriod = "all"): Promise<Record<string, number>> {
  const store = await readStore();
  const now = new Date();
  let cutoff = "";

  if (period !== "all") {
    const d = new Date(now);
    if (period === "day") d.setDate(d.getDate() - 1);
    else if (period === "week") d.setDate(d.getDate() - 7);
    else if (period === "month") d.setMonth(d.getMonth() - 1);
    else if (period === "year") d.setFullYear(d.getFullYear() - 1);
    cutoff = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-") + "T" + String(d.getHours()).padStart(2, "0");
  }

  const result: Record<string, number> = {};
  for (const [key, countries] of Object.entries(store)) {
    if (period !== "all" && key < cutoff) continue;
    for (const [code, count] of Object.entries(countries)) {
      result[code] = (result[code] ?? 0) + count;
    }
  }
  return result;
}

export async function logGeoVisit(countryCode: string): Promise<void> {
  if (!countryCode || countryCode.length !== 2) return;
  const store = await readStore();
  const now = new Date();
  const key = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-") + "T" + String(now.getHours()).padStart(2, "0");
  if (!store[key]) store[key] = {};
  store[key][countryCode] = (store[key][countryCode] ?? 0) + 1;
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(store), "utf-8");
}
