import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readStats } from "@/lib/stats";

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
  const stats = await readStats();
  const now = new Date();

  // Flatten all view timestamps
  const timestamps: string[] = [];
  for (const entries of Object.values(stats)) {
    for (const v of entries) {
      if (typeof v !== "string" && v.at) timestamps.push(v.at);
    }
  }

  type Bucket = { label: string; count: number };
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

  return NextResponse.json(buckets);
}
