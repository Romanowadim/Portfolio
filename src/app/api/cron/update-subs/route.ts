import { NextRequest, NextResponse } from "next/server";
import { readDynamicArtworks, writeDynamicArtworks } from "@/lib/blob";
import { extractChannel, format } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not set" }, { status: 500 });
  }

  const artworks = await readDynamicArtworks();

  const targets = artworks.filter(
    (a) =>
      a.category === "youtube" &&
      a.clientSocials?.some((s) => s.icon === "youtube" && s.url)
  );

  let updated = 0;
  let errors = 0;
  const details: { id: string; status: "ok" | "error"; subscribers?: string; error?: string }[] = [];

  for (const artwork of targets) {
    const social = artwork.clientSocials!.find((s) => s.icon === "youtube" && s.url)!;
    const channel = extractChannel(social.url);

    if (!channel) {
      errors++;
      details.push({ id: artwork.id, status: "error", error: "Cannot parse YouTube URL" });
      continue;
    }

    try {
      const param =
        channel.type === "id"
          ? `id=${encodeURIComponent(channel.value)}`
          : `forHandle=${encodeURIComponent(channel.value)}`;

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&${param}&key=${apiKey}`
      );
      const data = await res.json();
      const item = data.items?.[0];

      if (!item) {
        errors++;
        details.push({ id: artwork.id, status: "error", error: "Channel not found" });
        continue;
      }

      const count = parseInt(item.statistics.subscriberCount ?? "0", 10);
      artwork.subscribers = format(count);
      updated++;
      details.push({ id: artwork.id, status: "ok", subscribers: artwork.subscribers });
    } catch (err) {
      errors++;
      details.push({ id: artwork.id, status: "error", error: String(err) });
    }
  }

  if (updated > 0) {
    await writeDynamicArtworks(artworks);
  }

  return NextResponse.json({ updated, errors, details });
}
