import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readCategories, writeCategories } from "@/lib/categories";
import type { Category } from "@/types/category";

export async function GET() {
  const categories = await readCategories();
  return NextResponse.json(categories);
}

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) return false;
  return true;
}

export async function PUT(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories: Category[] = await req.json();
    await writeCategories(categories);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
