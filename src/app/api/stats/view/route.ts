import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { recordView } from "@/lib/stats";

export async function POST(req: Request) {
  const { artworkId } = await req.json();
  if (!artworkId || typeof artworkId !== "string") {
    return NextResponse.json({ error: "Missing artworkId" }, { status: 400 });
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
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
  }

  await recordView(artworkId, visitorId);
  return res;
}
