import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import fs from "fs/promises";
import path from "path";

const FILE = path.join(process.cwd(), "data", "site-settings.json");

type HeroImageEntry = {
  url: string;
  title: string;
  year: string;
  tools: string;
};

type SocialEntry = {
  name: string;
  url: string;
  icon: string;
};

type Settings = {
  heroImage: string;
  heroImages: HeroImageEntry[];
  socials: SocialEntry[];
};

function migrateEntry(item: unknown): HeroImageEntry {
  if (typeof item === "string") {
    return { url: item, title: "", year: "", tools: "" };
  }
  const obj = item as Record<string, unknown>;
  return {
    url: (obj.url as string) || "",
    title: (obj.title as string) || "",
    year: (obj.year as string) || "",
    tools: (obj.tools as string) || "",
  };
}

const DEFAULT_SOCIALS: SocialEntry[] = [
  { name: "ArtStation", url: "https://www.artstation.com/", icon: "/images/social/artstation.svg" },
  { name: "VK", url: "https://vk.com/", icon: "/images/social/vk.svg" },
  { name: "Instagram", url: "https://instagram.com/", icon: "/images/social/instagram.svg" },
  { name: "YouTube", url: "https://youtube.com/", icon: "/images/social/youtube.svg" },
  { name: "Tumblr", url: "https://tumblr.com/", icon: "/images/social/tumblr.svg" },
  { name: "DeviantArt", url: "https://deviantart.com/", icon: "/images/social/deviantart.svg" },
  { name: "Behance", url: "https://behance.net/", icon: "/images/social/behance.svg" },
];

async function read(): Promise<Settings> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf-8"));
    const heroImages: HeroImageEntry[] = Array.isArray(raw.heroImages)
      ? raw.heroImages.map(migrateEntry)
      : [migrateEntry(raw.heroImage || "/images/hero.png")];
    return {
      heroImage: raw.heroImage || "/images/hero.png",
      heroImages,
      socials: Array.isArray(raw.socials) ? raw.socials : DEFAULT_SOCIALS,
    };
  } catch {
    return {
      heroImage: "/images/hero.png",
      heroImages: [{ url: "/images/hero.png", title: "", year: "", tools: "" }],
      socials: DEFAULT_SOCIALS,
    };
  }
}

async function write(settings: Settings) {
  await fs.writeFile(FILE, JSON.stringify(settings, null, 2) + "\n");
}

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) return false;
  return true;
}

export async function GET() {
  return NextResponse.json(await read());
}

export async function PUT(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const current = await read();

  // Update metadata for an existing hero image
  if (body.updateMeta) {
    const { url, title, year, tools } = body.updateMeta;
    current.heroImages = current.heroImages.map((img) =>
      img.url === url ? { ...img, title, year, tools } : img
    );
    await write(current);
    return NextResponse.json(current);
  }

  // Update socials
  if (Array.isArray(body.socials)) {
    current.socials = body.socials;
    await write(current);
    return NextResponse.json(current);
  }

  // Set active hero (and add new image if not present)
  if (body.heroImage) {
    current.heroImage = body.heroImage;
    if (!current.heroImages.some((img) => img.url === body.heroImage)) {
      current.heroImages.push({ url: body.heroImage, title: "", year: "", tools: "" });
    }
  }

  await write(current);
  return NextResponse.json(current);
}

export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "No url provided" }, { status: 400 });
  }

  const current = await read();
  current.heroImages = current.heroImages.filter((img) => img.url !== url);

  // If deleted the active hero, fall back to first available or default
  if (current.heroImage === url) {
    current.heroImage = current.heroImages[0]?.url || "/images/hero.png";
  }

  await write(current);

  // Delete the file if it's in public/uploads
  if (url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", url);
    await fs.unlink(filePath).catch(() => {});
  }

  return NextResponse.json(current);
}
