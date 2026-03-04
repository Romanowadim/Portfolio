import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readVisits } from "@/lib/visits";
import { readStats } from "@/lib/stats";
import { readOrderClicks } from "@/lib/order-stats";

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) return false;
  return true;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [visits, stats, orderClicksData] = await Promise.all([readVisits(), readStats(), readOrderClicks()]);
  const todayPrefix = dateKey(new Date());

  // Today's site visitors (sum of hourly buckets for today)
  const todayVisitors = Object.entries(visits)
    .filter(([k]) => k.startsWith(todayPrefix))
    .reduce((s, [, v]) => s + v, 0);

  // Artwork views
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  let todayArtworkViews = 0;
  let allTimeArtworkViews = 0;
  for (const entries of Object.values(stats)) {
    allTimeArtworkViews += entries.length;
    todayArtworkViews += entries.filter((v) => {
      const at = typeof v === "string" ? 0 : new Date(v.at).getTime();
      return now - at < DAY_MS;
    }).length;
  }

  const orderClicks = Object.values(orderClicksData).reduce((s, v) => s + v, 0);

  return NextResponse.json({ todayVisitors, todayArtworkViews, allTimeArtworkViews, orderClicks });
}
