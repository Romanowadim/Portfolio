import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readVisits } from "@/lib/visits";

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

export async function GET(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "week";
  const all = await readVisits();
  const now = new Date();

  type Bucket = { label: string; count: number };
  const buckets: Bucket[] = [];

  if (period === "day") {
    // Last 24 hours, one bucket per hour
    for (let h = 23; h >= 0; h--) {
      const d = new Date(now);
      d.setHours(now.getHours() - h, 0, 0, 0);
      const key = dateKey(d) + "T" + String(d.getHours()).padStart(2, "0");
      buckets.push({ label: String(d.getHours()).padStart(2, "0"), count: all[key] ?? 0 });
    }
  } else if (period === "week") {
    // Last 7 days
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(now.getDate() - d);
      const dk = dateKey(date);
      const count = Object.entries(all)
        .filter(([k]) => k.startsWith(dk))
        .reduce((s, [, v]) => s + v, 0);
      buckets.push({ label: DAY_NAMES[date.getDay()], count });
    }
  } else if (period === "month") {
    // Last 30 days
    for (let d = 29; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(now.getDate() - d);
      const dk = dateKey(date);
      const count = Object.entries(all)
        .filter(([k]) => k.startsWith(dk))
        .reduce((s, [, v]) => s + v, 0);
      buckets.push({ label: String(date.getDate()), count });
    }
  } else {
    // Year: last 12 months
    for (let m = 11; m >= 0; m--) {
      const date = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const prefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const count = Object.entries(all)
        .filter(([k]) => k.startsWith(prefix))
        .reduce((s, [, v]) => s + v, 0);
      buckets.push({ label: MONTH_NAMES[date.getMonth()], count });
    }
  }

  return NextResponse.json(buckets);
}
