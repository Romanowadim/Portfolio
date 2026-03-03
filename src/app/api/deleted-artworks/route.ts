import { NextResponse } from "next/server";
import { readDeletedIds } from "@/lib/deleted";

export async function GET() {
  const ids = await readDeletedIds();
  return NextResponse.json(ids);
}
