import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readArtworkOrder, writeArtworkOrder, ArtworkOrder } from "@/lib/order";

export async function GET() {
  const order = await readArtworkOrder();
  return NextResponse.json(order);
}

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const order: ArtworkOrder = await req.json();
    await writeArtworkOrder(order);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
