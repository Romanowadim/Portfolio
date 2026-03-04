import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const HIDDEN_FILE = path.join(DATA_DIR, "hidden-artworks.json");

export async function readHiddenIds(): Promise<string[]> {
  try {
    const content = await readFile(HIDDEN_FILE, "utf-8");
    return JSON.parse(content) as string[];
  } catch {
    return [];
  }
}

export async function addHiddenId(id: string): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const ids = await readHiddenIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await writeFile(HIDDEN_FILE, JSON.stringify(ids, null, 2), "utf-8");
  }
}

export async function removeHiddenId(id: string): Promise<void> {
  const ids = await readHiddenIds();
  const filtered = ids.filter((x) => x !== id);
  if (filtered.length !== ids.length) {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(HIDDEN_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  }
}
