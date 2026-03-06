import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { getOnlineCount, getOnlineCountries } from "@/lib/online";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ count: getOnlineCount(), countries: getOnlineCountries() });
}
