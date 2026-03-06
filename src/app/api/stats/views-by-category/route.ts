import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readCategoryViews } from "@/lib/category-stats";
import { readCategories } from "@/lib/categories";

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) return false;
  return true;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Bucket = { label: string; count: number };

export async function GET(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "week";

  const [views, categories] = await Promise.all([
    readCategoryViews(),
    readCategories(),
  ]);
  const now = new Date();

  const locale = searchParams.get("locale") ?? "en";
  const nameMap = new Map<string, string>();
  for (const cat of categories) {
    nameMap.set(cat.id, cat.label[locale as "ru" | "en"] || cat.id);
  }

  // Aggregate by top-level category (keys without "/")
  const aggregated = new Map<string, string[]>();
  for (const [key, entries] of Object.entries(views)) {
    const topKey = key.includes("/") ? key.split("/")[0] : key;
    const existing = aggregated.get(topKey) ?? [];
    for (const e of entries) existing.push(e.at);
    aggregated.set(topKey, existing);
  }

  const result = Array.from(aggregated.entries())
    .map(([id, timestamps]) => {
      const total = timestamps.length;
      const buckets: Bucket[] = [];

      if (period === "day") {
        for (let h = 23; h >= 0; h--) {
          const d = new Date(now);
          d.setHours(now.getHours() - h, 0, 0, 0);
          const key = dateKey(d) + "T" + String(d.getHours()).padStart(2, "0");
          const count = timestamps.filter((t) => {
            const td = new Date(t);
            return dateKey(td) + "T" + String(td.getHours()).padStart(2, "0") === key;
          }).length;
          buckets.push({ label: String(d.getHours()).padStart(2, "0"), count });
        }
      } else if (period === "week") {
        for (let d = 6; d >= 0; d--) {
          const date = new Date(now);
          date.setDate(now.getDate() - d);
          const dk = dateKey(date);
          const count = timestamps.filter((t) => dateKey(new Date(t)) === dk).length;
          buckets.push({ label: DAY_NAMES[date.getDay()], count });
        }
      } else if (period === "month") {
        for (let d = 29; d >= 0; d--) {
          const date = new Date(now);
          date.setDate(now.getDate() - d);
          const dk = dateKey(date);
          const count = timestamps.filter((t) => dateKey(new Date(t)) === dk).length;
          buckets.push({ label: String(date.getDate()), count });
        }
      } else {
        for (let m = 11; m >= 0; m--) {
          const date = new Date(now.getFullYear(), now.getMonth() - m, 1);
          const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const count = timestamps.filter((t) => t.startsWith(prefix)).length;
          buckets.push({ label: MONTH_NAMES[date.getMonth()], count });
        }
      }

      return { id, name: nameMap.get(id) ?? id, total, buckets };
    })
    .filter((e) => e.total > 0)
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({ entities: result });
}
