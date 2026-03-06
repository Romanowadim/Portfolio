import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const WEBP_QUALITY = 82;
const SKIP_EXTENSIONS = new Set([".svg", ".gif", ".webp"]);

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase();

  // SVG, GIF, already-WebP — save as-is
  if (SKIP_EXTENSIONS.has(ext)) {
    const filename = `${Date.now()}-${file.name}`;
    await writeFile(path.join(uploadsDir, filename), buffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  }

  // Convert to WebP
  const baseName = path.basename(file.name, ext);
  const filename = `${Date.now()}-${baseName}.webp`;
  const webpBuffer = await sharp(buffer).webp({ quality: WEBP_QUALITY }).toBuffer();
  await writeFile(path.join(uploadsDir, filename), webpBuffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
