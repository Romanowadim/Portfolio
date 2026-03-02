import { put, list } from "@vercel/blob";
import type { Artwork } from "@/data/artworks";

const ARTWORKS_FILE = "artworks.json";

export async function readDynamicArtworks(): Promise<Artwork[]> {
  try {
    const { blobs } = await list({ prefix: ARTWORKS_FILE });
    const blob = blobs.find((b) => b.pathname === ARTWORKS_FILE);
    if (!blob) return [];
    const res = await fetch(blob.url, { cache: "no-store" });
    return (await res.json()) as Artwork[];
  } catch {
    return [];
  }
}

export async function writeDynamicArtworks(artworks: Artwork[]): Promise<void> {
  await put(ARTWORKS_FILE, JSON.stringify(artworks, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
