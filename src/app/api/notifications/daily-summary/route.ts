import { NextRequest, NextResponse } from "next/server";
import { readVisits } from "@/lib/visits";
import { readStats } from "@/lib/stats";
import { addNotification } from "@/lib/notifications";

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  // Protect with a secret or allow Vercel Cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayPrefix = dateKey(now);

  const [visits, stats] = await Promise.all([readVisits(), readStats()]);

  const todayVisitors = Object.entries(visits)
    .filter(([k]) => k.startsWith(todayPrefix))
    .reduce((s, [, v]) => s + v, 0);

  const DAY_MS = 24 * 60 * 60 * 1000;
  let todayArtworkViews = 0;
  for (const entries of Object.values(stats)) {
    todayArtworkViews += entries.filter((v) => {
      const at = typeof v === "string" ? 0 : new Date(v.at).getTime();
      return now.getTime() - at < DAY_MS;
    }).length;
  }

  await addNotification({
    type: "daily_summary",
    message: `Daily summary: ${todayVisitors} visitors, ${todayArtworkViews} artwork views`,
    data: { todayVisitors, todayArtworkViews },
  });

  return NextResponse.json({ ok: true, todayVisitors, todayArtworkViews });
}
