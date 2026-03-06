import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readCoworkers, writeCoworkers } from "@/lib/blob";
import { unlink } from "fs/promises";
import path from "path";
import type { Coworker } from "@/lib/blob";

function deleteUpload(url: string | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  unlink(path.join(process.cwd(), "public", url)).catch(() => {});
}

export async function GET() {
  return NextResponse.json(await readCoworkers());
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
  const coworker: Coworker = await req.json();
  const existing = await readCoworkers();
  existing.push(coworker);
  await writeCoworkers(existing);
  return NextResponse.json({ ok: true, coworker });
}

export async function PUT(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const coworker: Coworker = await req.json();
  const existing = await readCoworkers();
  const idx = existing.findIndex((c) => c.id === coworker.id);
  if (idx !== -1) {
    const old = existing[idx];
    if (old.avatar && old.avatar !== coworker.avatar) deleteUpload(old.avatar);
    existing[idx] = coworker;
  } else {
    existing.push(coworker);
  }
  await writeCoworkers(existing);
  return NextResponse.json({ ok: true, coworker });
}

export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  const coworkers = await readCoworkers();
  const coworker = coworkers.find((c) => c.id === id);
  await writeCoworkers(coworkers.filter((c) => c.id !== id));
  if (coworker) {
    deleteUpload(coworker.avatar);
    coworker.socials?.forEach((s) => deleteUpload(s.icon));
  }
  return NextResponse.json({ ok: true });
}
