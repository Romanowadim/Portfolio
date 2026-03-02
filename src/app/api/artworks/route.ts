import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readDynamicArtworks, writeDynamicArtworks } from "@/lib/blob";
import type { Artwork } from "@/data/artworks";

export async function GET() {
  const artworks = await readDynamicArtworks();
  return NextResponse.json(artworks);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const artwork: Artwork = await req.json();
    const existing = await readDynamicArtworks();
    existing.push(artwork);
    await writeDynamicArtworks(existing);
    return NextResponse.json({ ok: true, artwork });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save artwork";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
