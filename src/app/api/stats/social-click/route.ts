import { NextRequest, NextResponse } from "next/server";
import { recordSocialClick, readSocialClicks, getSocialClickCounts } from "@/lib/social-clicks";

export async function POST(req: NextRequest) {
  try {
    const { name } = (await req.json()) as { name: string };
    if (!name) return NextResponse.json({ ok: false }, { status: 400 });
    await recordSocialClick(name);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await readSocialClicks();
    return NextResponse.json(getSocialClickCounts(data));
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
