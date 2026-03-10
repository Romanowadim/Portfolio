import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { withFileLock } from "./file-lock";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "orders.json");

export type Order = {
  id: string;
  name: string;
  projectName?: string;
  themes: string[];
  description: string;
  email: string;
  references?: string;
  totalPrice: number;
  createdAt: string;
};

export async function readOrders(): Promise<Order[]> {
  try {
    const content = await readFile(FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export function addOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order> {
  return withFileLock(FILE, async () => {
    const orders = await readOrders();
    const entry: Order = {
      ...order,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
    };
    orders.unshift(entry);
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify(orders, null, 2), "utf-8");
    return entry;
  });
}

export function deleteOrder(id: string): Promise<void> {
  return withFileLock(FILE, async () => {
    const orders = await readOrders();
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify(orders.filter((o) => o.id !== id), null, 2), "utf-8");
  });
}
