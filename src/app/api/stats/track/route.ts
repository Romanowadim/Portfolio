import { NextRequest, NextResponse } from "next/server";
import { incrementVisit } from "@/lib/visits";
import { logReferrer } from "@/lib/referrers";
import { logGeoVisit } from "@/lib/geo-visits";
import { markOnline } from "@/lib/online";

export async function POST(req: NextRequest) {
  try {
    let referrer = "";
    try {
      const body = await req.json();
      referrer = body.referrer || "";
    } catch { /* no body */ }
    const country = req.headers.get("x-vercel-ip-country") || "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    markOnline(ip);
    await Promise.all([incrementVisit(), logReferrer(referrer), logGeoVisit(country)]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
