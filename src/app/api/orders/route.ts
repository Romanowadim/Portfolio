import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readOrders, addOrder, deleteOrder } from "@/lib/orders";
import { addNotification } from "@/lib/notifications";
import { sendTelegram } from "@/lib/telegram";
import { sendOrderToBot } from "@/lib/orders-bot";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readOrders());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, projectName, themes, description, email, references, totalPrice } = body;

    if (!name || !themes?.length || !description || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await addOrder({
      name,
      projectName: projectName || undefined,
      themes,
      description,
      email,
      references: references || undefined,
      totalPrice: totalPrice ?? 0,
    });

    const priceLabel = totalPrice > 0 ? `~ ${totalPrice}$` : "0$";

    await Promise.all([
      addNotification({
        type: "order",
        message: `${name} — ${themes.join(", ")}`,
        data: { orderId: order.id },
      }),
      sendTelegram(`New order from <b>${name}</b>\nThemes: ${themes.join(", ")}\nPrice: <b>${priceLabel}</b>`),
      sendOrderToBot({
        id: order.id,
        name,
        projectName,
        themes,
        description,
        email,
        totalPrice: totalPrice ?? 0,
      }),
    ]);

    return NextResponse.json({ ok: true, order });
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await req.json();
    await deleteOrder(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
