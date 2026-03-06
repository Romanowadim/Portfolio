import { NextRequest, NextResponse } from "next/server";
import { recordContactClick, readContactClicks, getContactClickCounts } from "@/lib/contact-clicks";

export async function POST(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id: string };
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await recordContactClick(id);
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
