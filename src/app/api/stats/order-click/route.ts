import { NextResponse } from "next/server";
import { incrementOrderClick } from "@/lib/order-stats";

export async function POST() {
  try {
    await incrementOrderClick();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
