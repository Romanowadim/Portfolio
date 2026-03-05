import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { Equipment } from "@/data/equipment";
import { equipment as staticEquipment } from "@/data/equipment";

const DATA_DIR = path.join(process.cwd(), "data");
const EQUIPMENT_FILE = path.join(DATA_DIR, "equipment.json");

export async function readEquipment(): Promise<Equipment[]> {
  try {
    const content = await readFile(EQUIPMENT_FILE, "utf-8");
    return JSON.parse(content) as Equipment[];
  } catch {
    return staticEquipment;
  }
}

export async function writeEquipment(items: Equipment[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(EQUIPMENT_FILE, JSON.stringify(items, null, 2), "utf-8");
}
