import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "order-clicks.json");

// Storage format: { "2026-03-04": 5, ... } — daily counts
export async function readOrderClicks(): Promise<Record<string, number>> {
  try {
    return JSON.parse(await readFile(FILE, "utf-8"));
  } catch {
    return {};
  }
}

export async function incrementOrderClick(): Promise<void> {
  const data = await readOrderClicks();
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  data[key] = (data[key] ?? 0) + 1;
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(data), "utf-8");
}
