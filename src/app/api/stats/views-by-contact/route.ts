import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { readStats } from "@/lib/stats";
import { readDynamicArtworks, readContacts } from "@/lib/blob";

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

type Bucket = { label: string; count: number };

export async function GET(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "week";

  const [stats, artworks, contacts] = await Promise.all([
    readStats(),
    readDynamicArtworks(),
    readContacts(),
  ]);

  const now = new Date();

  // Build contactId → artworkIds map
  const contactArtworks = new Map<string, string[]>();
  for (const a of artworks) {
    if (!a.contactId) continue;
    const list = contactArtworks.get(a.contactId) || [];
    list.push(a.id);
    contactArtworks.set(a.contactId, list);
  }

  // For each contact with artworks, collect timestamps and bucket them
  const result = contacts
    .filter((c) => contactArtworks.has(c.id))
    .map((contact) => {
      const artworkIds = contactArtworks.get(contact.id)!;

      // Collect all view timestamps for this contact's artworks
      const timestamps: string[] = [];
      for (const aid of artworkIds) {
        const entries = stats[aid];
        if (!entries) continue;
        for (const v of entries) {
          if (typeof v !== "string" && v.at) timestamps.push(v.at);
        }
      }

      const totalViews = timestamps.length;
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

      return {
        id: contact.id,
        name: contact.clientName,
        totalViews,
        buckets,
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews);

  // ── FAKE DATA for testing ──
  const FAKE_NAMES = ["Alice Wang", "Boris Petrov", "Clara Santos", "David Kim", "Elena Fischer", "Frank Müller", "Grace Lee", "Hugo Martin", "Ingrid Olsen", "James Taylor", "Keiko Tanaka", "Luca Rossi"];
  const bucketLen = result.length > 0 ? result[0].buckets.length : period === "day" ? 24 : period === "week" ? 7 : period === "month" ? 30 : 12;
  const labels = result.length > 0 ? result[0].buckets.map((b) => b.label) : [];
  if (labels.length === 0) {
    for (let i = 0; i < bucketLen; i++) labels.push(String(i));
  }
  for (const name of FAKE_NAMES) {
    const buckets = labels.map((label) => ({
      label,
      count: Math.floor(Math.random() * 40),
    }));
    const totalViews = buckets.reduce((s, b) => s + b.count, 0);
    result.push({ id: `fake-${name}`, name, totalViews, buckets });
  }
  result.sort((a, b) => b.totalViews - a.totalViews);
  // ── END FAKE DATA ──

  return NextResponse.json({ contacts: result });
}
