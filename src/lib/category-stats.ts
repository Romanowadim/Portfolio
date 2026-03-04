import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CATEGORY_VIEWS_FILE = path.join(DATA_DIR, "category-views.json");

type ViewEntry = { id: string; at: string };
// key (categoryId or categoryId/subcategoryId) -> array of viewer entries
type CategoryViews = Record<string, ViewEntry[]>;

export async function readCategoryViews(): Promise<CategoryViews> {
  try {
    const content = await readFile(CATEGORY_VIEWS_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function writeCategoryViews(data: CategoryViews): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CATEGORY_VIEWS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function recordCategoryView(key: string, visitorId: string): Promise<void> {
  const data = await readCategoryViews();
  const entries = data[key] ?? [];
  if (!entries.some((v) => v.id === visitorId)) {
    entries.push({ id: visitorId, at: new Date().toISOString() });
    data[key] = entries;
    await writeCategoryViews(data);
  }
}

export function getCategoryViewCounts(
  data: CategoryViews
): Record<string, { total: number; recent: number }> {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  return Object.fromEntries(
    Object.entries(data).map(([key, entries]) => [
      key,
      {
        total: entries.length,
        recent: entries.filter((v) => now - new Date(v.at).getTime() < DAY_MS).length,
      },
    ])
  );
}
