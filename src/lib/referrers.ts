import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const REFERRERS_FILE = path.join(DATA_DIR, "referrers.json");

// Storage: { "google.com": 15, "behance.net": 8, ... }
export async function readReferrers(): Promise<Record<string, number>> {
  try {
    const content = await readFile(REFERRERS_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function logReferrer(referer: string): Promise<void> {
  if (!referer) return;
  try {
    const url = new URL(referer);
    const host = url.hostname.replace(/^www\./, "");
    // Skip self-referrals
    if (!host || host === "localhost") return;
    const data = await readReferrers();
    data[host] = (data[host] ?? 0) + 1;
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(REFERRERS_FILE, JSON.stringify(data), "utf-8");
  } catch {
    // Invalid URL or write error — skip
  }
}
