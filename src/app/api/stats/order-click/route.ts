import { NextResponse } from "next/server";
import { incrementOrderClick } from "@/lib/order-stats";
import { addNotification } from "@/lib/notifications";

export async function POST() {
  try {
    await Promise.all([
      incrementOrderClick(),
      addNotification({
        type: "order",
        message: "New order click",
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
