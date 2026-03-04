import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { recordCategoryView } from "@/lib/category-stats";

export async function POST(req: Request) {
  const { key } = await req.json();
  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  const cookieStore = await cookies();
  let visitorId = cookieStore.get("visitor-id")?.value;

  const res = NextResponse.json({ ok: true });

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    res.cookies.set("visitor-id", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }

  await recordCategoryView(key, visitorId);
  return res;
}
