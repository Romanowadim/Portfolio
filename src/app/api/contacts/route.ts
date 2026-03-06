import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readContacts, writeContacts, readDynamicArtworks, writeDynamicArtworks } from "@/lib/blob";
import { unlink } from "fs/promises";
import path from "path";
import type { Contact } from "@/lib/blob";

function deleteUpload(url: string | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  unlink(path.join(process.cwd(), "public", url)).catch(() => {});
}

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
  if (idx !== -1) {
    const old = existing[idx];
    if (old.clientAvatar && old.clientAvatar !== contact.clientAvatar) deleteUpload(old.clientAvatar);
    existing[idx] = contact;
  } else {
    existing.push(contact);
  }
  await writeContacts(existing);
  return NextResponse.json({ ok: true, contact });
}

export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  const contacts = await readContacts();
  const contact = contacts.find((c) => c.id === id);
  await writeContacts(contacts.filter((c) => c.id !== id));
  if (contact) {
    deleteUpload(contact.clientAvatar);
    contact.clientSocials?.forEach((s) => deleteUpload(s.icon));
  }

  // Clear contactId from artworks that referenced this contact
  const artworks = await readDynamicArtworks();
  const updated = artworks.map((a) =>
    a.contactId === id ? { ...a, contactId: undefined } : a
  );
  if (updated.some((a, i) => a !== artworks[i])) {
    await writeDynamicArtworks(updated);
  }

  return NextResponse.json({ ok: true });
}
