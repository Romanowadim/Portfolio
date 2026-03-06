import { NextRequest, NextResponse } from "next/server";
import { readDynamicArtworks, writeDynamicArtworks, readContacts } from "@/lib/blob";
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
  const contacts = await readContacts();

  // Resolve YouTube URL: from linked contact or inline clientSocials
  const getYoutubeUrl = (a: (typeof artworks)[number]): string | undefined => {
    const socials = a.contactId
      ? contacts.find((c) => c.id === a.contactId)?.clientSocials
      : a.clientSocials;
    return socials?.find((s) => s.icon === "youtube" && s.url)?.url;
  };

  const targets = artworks.filter(
    (a) => (a.displayType === "youtube" || (!a.displayType && a.category === "youtube")) && getYoutubeUrl(a)
  );

  let updated = 0;
  let errors = 0;
  const details: { id: string; status: "ok" | "error"; subscribers?: string; error?: string }[] = [];

  for (const artwork of targets) {
    const youtubeUrl = getYoutubeUrl(artwork)!;
    const channel = extractChannel(youtubeUrl);

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
