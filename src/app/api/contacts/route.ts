import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readContacts, writeContacts } from "@/lib/blob";
import type { Contact } from "@/lib/blob";

export async function GET() {
  return NextResponse.json(await readContacts());
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
  const contact: Contact = await req.json();
  const existing = await readContacts();
  existing.push(contact);
  await writeContacts(existing);
  return NextResponse.json({ ok: true, contact });
}

export async function PUT(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const contact: Contact = await req.json();
  const existing = await readContacts();
  const idx = existing.findIndex((c) => c.id === contact.id);
  if (idx === -1) existing.push(contact);
  else existing[idx] = contact;
  await writeContacts(existing);
  return NextResponse.json({ ok: true, contact });
}

export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  await writeContacts((await readContacts()).filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
