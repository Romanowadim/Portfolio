import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readDynamicArtworks, writeDynamicArtworks } from "@/lib/blob";
import type { Artwork } from "@/data/artworks";

export async function GET() {
  const artworks = await readDynamicArtworks();
  return NextResponse.json(artworks);
}

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) return false;
  return true;
}

export async function POST(req: Request) {
  if (!(await requireAuth())) {
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

export async function PUT(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const artwork: Artwork = await req.json();
    const existing = await readDynamicArtworks();
    const idx = existing.findIndex((a) => a.id === artwork.id);
    if (idx === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    existing[idx] = artwork;
    await writeDynamicArtworks(existing);
    return NextResponse.json({ ok: true, artwork });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update artwork";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    const existing = await readDynamicArtworks();
    const filtered = existing.filter((a) => a.id !== id);
    if (filtered.length === existing.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await writeDynamicArtworks(filtered);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete artwork";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
