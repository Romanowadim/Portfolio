import { NextResponse } from "next/server";
import { incrementVisit } from "@/lib/visits";

export async function POST() {
  try {
    await incrementVisit();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
