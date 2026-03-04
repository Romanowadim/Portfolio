import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readHiddenIds, addHiddenId, removeHiddenId } from "@/lib/hidden";

export async function GET() {
  const ids = await readHiddenIds();
  return NextResponse.json(ids);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, hidden } = await req.json();
  if (!id || typeof hidden !== "boolean") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (hidden) {
    await addHiddenId(id);
  } else {
    await removeHiddenId(id);
  }

  const ids = await readHiddenIds();
  return NextResponse.json(ids);
}
