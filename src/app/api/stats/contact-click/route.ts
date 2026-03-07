import { NextRequest, NextResponse } from "next/server";
import { recordContactClick, readContactClicks, getContactClickCounts } from "@/lib/contact-clicks";
import { addNotification } from "@/lib/notifications";
import { readContacts, readCoworkers } from "@/lib/blob";

export async function POST(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id: string };
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await recordContactClick(id);

    const [contacts, coworkers] = await Promise.all([readContacts(), readCoworkers()]);
    const contact = contacts.find((c) => c.id === id);
    const coworker = !contact ? coworkers.find((c) => c.id === id) : undefined;

    if (contact) {
      addNotification({
        type: "contact_click",
        message: contact.clientName || id,
        data: { contactId: id, avatar: contact.clientAvatar },
      }).catch(() => {});
    } else {
      addNotification({
        type: "coworker_click",
        message: coworker?.name || id,
        data: { contactId: id, avatar: coworker?.avatar },
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await readContactClicks();
    return NextResponse.json(getContactClickCounts(data));
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
