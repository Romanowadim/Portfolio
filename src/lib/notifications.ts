import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "notifications.json");

export type Notification = {
  id: string;
  type: "visit" | "order" | "view" | "contact_click" | "coworker_click" | "daily_summary";
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
};

export async function readNotifications(): Promise<Notification[]> {
  try {
    const content = await readFile(FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function save(notifications: Notification[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(notifications, null, 2), "utf-8");
}

function currentHourKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}`;
}

export async function addNotification(n: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification> {
  const notifications = await readNotifications();

  // Stack notifications by hour (except order — each order is unique)
  if (n.type !== "order" && n.type !== "daily_summary") {
    const hourKey = currentHourKey();
    const stackKey = n.data?.artworkId || n.data?.contactId || undefined;
    const existing = notifications.find((x) =>
      x.type === n.type && x.data?.hourKey === hourKey &&
      (stackKey ? (x.data?.artworkId === stackKey || x.data?.contactId === stackKey) : !x.data?.artworkId && !x.data?.contactId)
    );
    if (existing) {
      const count = ((existing.data?.count as number) || 1) + 1;
      existing.data = { ...existing.data, count, hourKey };
      if (n.type === "visit") {
        existing.message = `New visitors (${count})`;
      } else if (n.type === "view") {
        existing.message = n.message; // keep latest artwork name
      } else {
        existing.message = n.message;
      }
      existing.createdAt = new Date().toISOString();
      existing.read = false;
      const idx = notifications.indexOf(existing);
      if (idx > 0) { notifications.splice(idx, 1); notifications.unshift(existing); }
      await save(notifications);
      notifySubscribers(existing);
      return existing;
    }
    n = { ...n, data: { ...n.data, count: 1, hourKey } };
  }

  const entry: Notification = {
    ...n,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(entry);
  // Keep only last 100 notifications
  if (notifications.length > 100) notifications.length = 100;
  await save(notifications);
  notifySubscribers(entry);
  return entry;
}

export async function markAllRead(): Promise<void> {
  const notifications = await readNotifications();
  for (const n of notifications) n.read = true;
  await save(notifications);
}

export async function markRead(id: string): Promise<void> {
  const notifications = await readNotifications();
  const n = notifications.find((x) => x.id === id);
  if (n) n.read = true;
  await save(notifications);
}

export async function clearAll(): Promise<void> {
  await save([]);
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await readNotifications();
  return notifications.filter((n) => !n.read).length;
}

// SSE subscribers
type Subscriber = (notification: Notification) => void;
const subscribers: Set<Subscriber> =
  (globalThis as Record<string, unknown>).__notifSubs as Set<Subscriber> ??
  ((globalThis as Record<string, unknown>).__notifSubs = new Set<Subscriber>());

export function subscribe(cb: Subscriber): () => void {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

function notifySubscribers(n: Notification) {
  for (const cb of subscribers) cb(n);
}
