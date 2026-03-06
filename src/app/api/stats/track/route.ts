import { NextRequest, NextResponse } from "next/server";
import { incrementVisit } from "@/lib/visits";
import { logReferrer } from "@/lib/referrers";

export async function POST(req: NextRequest) {
  try {
    let referrer = "";
    try {
      const body = await req.json();
      referrer = body.referrer || "";
    } catch { /* no body */ }
    await Promise.all([incrementVisit(), logReferrer(referrer)]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
