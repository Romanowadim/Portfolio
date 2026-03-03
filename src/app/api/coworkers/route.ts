import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readCoworkers, writeCoworkers } from "@/lib/blob";
import type { Coworker } from "@/lib/blob";

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
  if (idx === -1) existing.push(coworker);
  else existing[idx] = coworker;
  await writeCoworkers(existing);
  return NextResponse.json({ ok: true, coworker });
}

export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  await writeCoworkers((await readCoworkers()).filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
