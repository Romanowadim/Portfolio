import { NextRequest, NextResponse } from "next/server";
import { markOnline } from "@/lib/online";

export async function POST(req: NextRequest) {
  try {
    let page = "/";
    try {
      const body = await req.json();
      page = body.page || "/";
    } catch { /* no body */ }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    markOnline(ip, page);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
