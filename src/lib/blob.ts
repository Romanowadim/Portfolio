import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { Artwork } from "@/data/artworks";

const DATA_DIR = path.join(process.cwd(), "data");
const ARTWORKS_FILE = path.join(DATA_DIR, "artworks.json");

export async function readDynamicArtworks(): Promise<Artwork[]> {
  try {
    const content = await readFile(ARTWORKS_FILE, "utf-8");
    return JSON.parse(content) as Artwork[];
  } catch {
    return [];
  }
}

export async function writeDynamicArtworks(artworks: Artwork[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(ARTWORKS_FILE, JSON.stringify(artworks, null, 2), "utf-8");
}
