import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { Category } from "@/types/category";

const DATA_DIR = path.join(process.cwd(), "data");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "personal",
    label: { ru: "Персональное", en: "Personal" },
    preview: "/images/portfolio-previews/personal.png",
    subcategories: [
      { id: "cg", label: { ru: "Компьютерная графика", en: "Computer Graphics" } },
      { id: "lineart", label: { ru: "Лайн-арт", en: "Line Art" } },
    ],
  },
  {
    id: "orders",
    label: { ru: "Заказы", en: "Orders" },
    preview: "/images/portfolio-previews/orders.jpg",
    subcategories: [],
  },
  {
    id: "youtube",
    label: { ru: "YouTube", en: "YouTube" },
    preview: "/images/portfolio-previews/youtube.jpg",
    subcategories: [],
  },
  {
    id: "gamedev",
    label: { ru: "Геймдев", en: "Gamedev" },
    preview: "/images/portfolio-previews/gamedev.jpg",
    subcategories: [],
  },
  {
    id: "other",
    label: { ru: "Другое", en: "Other" },
    preview: "/images/portfolio-previews/other.jpg",
    subcategories: [],
  },
];

export async function readCategories(): Promise<Category[]> {
  try {
    const content = await readFile(CATEGORIES_FILE, "utf-8");
    return JSON.parse(content) as Category[];
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function writeCategories(categories: Category[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2), "utf-8");
}
