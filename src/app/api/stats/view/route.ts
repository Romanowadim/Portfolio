import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { recordView } from "@/lib/stats";
import { addNotification } from "@/lib/notifications";
import { readDynamicArtworks } from "@/lib/blob";
import { artworks as staticArtworks } from "@/data/artworks";

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

  // Send view notification
  const dynamicArtworks = await readDynamicArtworks();
  const artwork = [...dynamicArtworks, ...staticArtworks].find((a) => a.id === artworkId);
  if (artwork) {
    addNotification({
      type: "view",
      message: artwork.title.en || artwork.title.ru,
      data: { artworkId, thumbnail: artwork.thumbnail || artwork.image },
    }).catch(() => {});
  }

  return res;
}
