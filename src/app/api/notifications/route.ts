import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readNotifications, markAllRead, markRead, clearAll } from "@/lib/notifications";

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) return false;
  return true;
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notifications = await readNotifications();
  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (body.action === "mark_all_read") {
      await markAllRead();
    } else if (body.action === "mark_read" && body.id) {
      await markRead(body.id);
    } else if (body.action === "clear_all") {
      await clearAll();
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
