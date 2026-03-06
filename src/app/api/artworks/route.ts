import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readDynamicArtworks, writeDynamicArtworks } from "@/lib/blob";
import { readDeletedIds, addDeletedId } from "@/lib/deleted";
import { unlink } from "fs/promises";
import path from "path";
import type { Artwork } from "@/data/artworks";

function deleteUploadedFile(url: string | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", url);
  unlink(filePath).catch(() => {});
}

export async function GET() {
  const artworks = await readDynamicArtworks();

  // One-time migration: backfill createdAt for existing entries that lack it
  const needsMigration = artworks.some((a) => !a.createdAt);
  if (needsMigration) {
    const now = new Date().toISOString();
    const migrated = artworks.map((a) =>
      a.createdAt ? a : { ...a, createdAt: now }
    );
    await writeDynamicArtworks(migrated);
    return NextResponse.json(migrated);
  }

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
    const withDate: Artwork = { ...artwork, createdAt: new Date().toISOString() };
    const existing = await readDynamicArtworks();
    existing.push(withDate);
    await writeDynamicArtworks(existing);
    return NextResponse.json({ ok: true, artwork: withDate });
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
      existing.push({ ...artwork, createdAt: artwork.createdAt ?? new Date().toISOString() });
    } else {
      const old = existing[idx];
      if (old.image && old.image !== artwork.image) deleteUploadedFile(old.image);
      if (old.thumbnail && old.thumbnail !== artwork.thumbnail) deleteUploadedFile(old.thumbnail);
      if (old.sketch && old.sketch !== artwork.sketch) deleteUploadedFile(old.sketch);
      existing[idx] = { ...artwork, createdAt: old.createdAt ?? artwork.createdAt };
    }
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
    const artwork = existing.find((a) => a.id === id);
    const filtered = existing.filter((a) => a.id !== id);
    if (filtered.length < existing.length) {
      // Dynamic artwork — remove from list and delete files
      await writeDynamicArtworks(filtered);
      if (artwork) {
        deleteUploadedFile(artwork.image);
        deleteUploadedFile(artwork.thumbnail);
        deleteUploadedFile(artwork.sketch);
      }
    } else {
      // Static artwork — record as deleted
      await addDeletedId(id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete artwork";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
