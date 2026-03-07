import { NextResponse } from "next/server";
import { incrementOrderClick } from "@/lib/order-stats";
import { addNotification } from "@/lib/notifications";
import { sendTelegram } from "@/lib/telegram";

export async function POST() {
  try {
    await Promise.all([
      incrementOrderClick(),
      addNotification({
        type: "order",
        message: "New order click",
      }),
      sendTelegram("New order <b>[300$]</b>"),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
