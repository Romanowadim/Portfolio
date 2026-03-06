import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readdir, readFile, writeFile, unlink, stat } from "fs/promises";
import path from "path";
import sharp from "sharp";

/* ── GET: storage stats ── */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let files: string[];
  try {
    files = await readdir(UPLOADS_DIR);
  } catch {
    return NextResponse.json({ totalFiles: 0, totalMB: 0, byType: {} });
  }

  let totalBytes = 0;
  const byType: Record<string, { count: number; bytes: number }> = {};

  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!ext) continue;
    try {
      const s = await stat(path.join(UPLOADS_DIR, f));
      if (!byType[ext]) byType[ext] = { count: 0, bytes: 0 };
      byType[ext].count++;
      byType[ext].bytes += s.size;
      if (RASTER_EXTS.has(ext)) totalBytes += s.size;
    } catch { /* skip */ }
  }

  const totalFiles = Object.entries(byType)
    .filter(([ext]) => RASTER_EXTS.has(ext))
    .reduce((sum, [, v]) => sum + v.count, 0);
  const byTypeMB = Object.fromEntries(
    Object.entries(byType).map(([ext, v]) => [ext, { count: v.count, mb: +(v.bytes / 1024 / 1024).toFixed(2) }])
  );

  return NextResponse.json({
    totalFiles,
    totalMB: +(totalBytes / 1024 / 1024).toFixed(2),
    byType: byTypeMB,
  });
}

const WEBP_QUALITY = 82;
const CONVERTIBLE = new Set([".png", ".jpg", ".jpeg", ".bmp", ".tiff"]);
const RASTER_EXTS = new Set([".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"]);

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const DATA_FILES = [
  "artworks.json",
  "categories.json",
  "contacts.json",
  "coworkers.json",
  "site-settings.json",
  "equipment.json",
];

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Find all convertible files
  let files: string[];
  try {
    files = await readdir(UPLOADS_DIR);
  } catch {
    return NextResponse.json({ converted: 0, savedBytes: 0 });
  }

  const toConvert = files.filter((f) => CONVERTIBLE.has(path.extname(f).toLowerCase()));
  if (toConvert.length === 0) {
    return NextResponse.json({ converted: 0, savedBytes: 0 });
  }

  // 2. Convert each file to WebP
  const renameMap: Record<string, string> = {}; // old filename -> new filename
  let totalSaved = 0;

  for (const filename of toConvert) {
    const ext = path.extname(filename);
    const baseName = filename.slice(0, -ext.length);
    const newFilename = `${baseName}.webp`;

    try {
      const srcPath = path.join(UPLOADS_DIR, filename);
      const dstPath = path.join(UPLOADS_DIR, newFilename);
      const srcBuffer = await readFile(srcPath);
      const webpBuffer = await sharp(srcBuffer).webp({ quality: WEBP_QUALITY }).toBuffer();

      await writeFile(dstPath, webpBuffer);
      totalSaved += srcBuffer.length - webpBuffer.length;

      // Delete original
      await unlink(srcPath);

      renameMap[`/uploads/${filename}`] = `/uploads/${newFilename}`;
    } catch {
      // Skip files that fail to convert
    }
  }

  // 3. Update all references in data JSON files
  if (Object.keys(renameMap).length > 0) {
    for (const dataFile of DATA_FILES) {
      try {
        const filePath = path.join(DATA_DIR, dataFile);
        let content = await readFile(filePath, "utf-8");
        let changed = false;
        for (const [oldUrl, newUrl] of Object.entries(renameMap)) {
          if (content.includes(oldUrl)) {
            content = content.replaceAll(oldUrl, newUrl);
            changed = true;
          }
        }
        if (changed) {
          await writeFile(filePath, content, "utf-8");
        }
      } catch {
        // File doesn't exist, skip
      }
    }
  }

  return NextResponse.json({
    converted: Object.keys(renameMap).length,
    savedBytes: totalSaved,
    savedMB: +(totalSaved / 1024 / 1024).toFixed(2),
  });
}
