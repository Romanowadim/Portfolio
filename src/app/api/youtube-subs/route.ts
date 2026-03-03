import { NextRequest, NextResponse } from "next/server";
import { extractChannel, format } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "YOUTUBE_API_KEY not set" }, { status: 500 });

  const channel = extractChannel(url);
  if (!channel) return NextResponse.json({ error: "Cannot parse YouTube URL" }, { status: 400 });

  const param = channel.type === "id"
    ? `id=${encodeURIComponent(channel.value)}`
    : `forHandle=${encodeURIComponent(channel.value)}`;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&${param}&key=${apiKey}`
  );
  const data = await res.json();

  const item = data.items?.[0];
  if (!item) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const count = parseInt(item.statistics.subscriberCount ?? "0", 10);
  return NextResponse.json({ count, formatted: format(count) });
}
