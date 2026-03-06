import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readReferrers } from "@/lib/referrers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await readReferrers();
  // Sort by count descending
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .map(([host, count]) => ({ host, count }));

  return NextResponse.json(sorted);
}
