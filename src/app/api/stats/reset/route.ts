import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  return !!(token && (await verifyToken(token)));
}

const resetTargets: Record<string, string> = {
  visits: "visits.json",
  views: "stats.json",
  referrers: "referrers.json",
  "contact-clicks": "contact-clicks.json",
  "social-clicks": "social-clicks.json",
  "order-clicks": "order-clicks.json",
  "category-views": "category-views.json",
};

export async function POST(req: NextRequest) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { target } = (await req.json()) as { target: string };
    const file = resetTargets[target];
    if (!file) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(path.join(DATA_DIR, file), "{}", "utf-8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
