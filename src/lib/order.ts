import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDER_FILE = path.join(DATA_DIR, "artwork-order.json");

export type ArtworkOrder = Record<string, string[]>;

export async function readArtworkOrder(): Promise<ArtworkOrder> {
  try {
    const content = await readFile(ORDER_FILE, "utf-8");
    return JSON.parse(content) as ArtworkOrder;
  } catch {
    return {};
  }
}

export async function writeArtworkOrder(order: ArtworkOrder): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ORDER_FILE, JSON.stringify(order, null, 2), "utf-8");
}
