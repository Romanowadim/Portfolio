import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DELETED_FILE = path.join(DATA_DIR, "deleted-artworks.json");

export async function readDeletedIds(): Promise<string[]> {
  try {
    const content = await readFile(DELETED_FILE, "utf-8");
    return JSON.parse(content) as string[];
  } catch {
    return [];
  }
}

export async function addDeletedId(id: string): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const ids = await readDeletedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await writeFile(DELETED_FILE, JSON.stringify(ids, null, 2), "utf-8");
  }
}
