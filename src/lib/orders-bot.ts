import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { withFileLock } from "./file-lock";

const BOT_TOKEN = process.env.ORDERS_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DATA_DIR = path.join(process.cwd(), "data");
const MAP_FILE = path.join(DATA_DIR, "order-messages.json");

const withLock = <T>(fn: () => Promise<T>) => withFileLock(MAP_FILE, fn);

type OrderMessageMap = Record<string, { email: string; name: string; orderId: string }>;

async function readMap(): Promise<OrderMessageMap> {
  try {
    return JSON.parse(await readFile(MAP_FILE, "utf-8"));
  } catch {
    return {};
  }
}

async function saveMap(data: OrderMessageMap): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(MAP_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function sendOrderToBot(order: {
  id: string;
  name: string;
  projectName?: string;
  themes: string[];
  description: string;
  email: string;
  totalPrice: number;
}): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) return false;

  const priceLabel = order.totalPrice > 0 ? `~ ${order.totalPrice}$` : "0$";
  const lines = [
    `📋 <b>New order</b>`,
    ``,
    `<b>Name:</b> ${order.name}`,
    order.projectName ? `<b>Project:</b> ${order.projectName}` : null,
    `<b>Themes:</b> ${order.themes.join(", ")}`,
    `<b>Price:</b> ${priceLabel}`,
    ``,
    `<b>Description:</b>`,
    order.description,
    ``,
    `<b>Email:</b> ${order.email}`,
    ``,
    `💬 Reply to this message to send an email to the customer.`,
  ].filter(Boolean);

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: lines.join("\n"), parse_mode: "HTML" }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    const messageId = String(data.result?.message_id);

    if (messageId) {
      await withLock(async () => {
        const map = await readMap();
        map[messageId] = { email: order.email, name: order.name, orderId: order.id };
        await saveMap(map);
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function getOrderByMessageId(
  messageId: string
): Promise<{ email: string; name: string; orderId: string } | null> {
  const map = await readMap();
  return map[messageId] ?? null;
}
