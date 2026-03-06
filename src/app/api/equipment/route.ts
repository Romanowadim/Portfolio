import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readEquipment, writeEquipment } from "@/lib/equipment";
import { unlink } from "fs/promises";
import path from "path";
import type { Equipment } from "@/data/equipment";

function deleteUpload(url: string | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  unlink(path.join(process.cwd(), "public", url)).catch(() => {});
}

export async function GET() {
  return NextResponse.json(await readEquipment());
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
  const item: Equipment = await req.json();
  const existing = await readEquipment();
  existing.push(item);
  await writeEquipment(existing);
  return NextResponse.json({ ok: true, item });
}

export async function PUT(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const item: Equipment = await req.json();
  const existing = await readEquipment();
  const idx = existing.findIndex((e) => e.id === item.id);
  if (idx !== -1) {
    const old = existing[idx];
    if (old.image && old.image !== item.image) deleteUpload(old.image);
    if (old.brandIcon && old.brandIcon !== item.brandIcon) deleteUpload(old.brandIcon);
    existing[idx] = item;
  } else {
    existing.push(item);
  }
  await writeEquipment(existing);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  const existing = await readEquipment();
  const item = existing.find((e) => e.id === id);
  await writeEquipment(existing.filter((e) => e.id !== id));
  if (item) {
    deleteUpload(item.image);
    deleteUpload(item.brandIcon);
  }
  return NextResponse.json({ ok: true });
}
