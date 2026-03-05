import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readEquipment, writeEquipment } from "@/lib/equipment";
import type { Equipment } from "@/data/equipment";

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
  if (idx === -1) existing.push(item);
  else existing[idx] = item;
  await writeEquipment(existing);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  await writeEquipment((await readEquipment()).filter((e) => e.id !== id));
  return NextResponse.json({ ok: true });
}
