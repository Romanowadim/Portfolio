import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { subscribe } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const MAX_CONNECTION_MS = 10 * 60 * 1000; // 10 min — client will reconnect

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleaned = false;

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        clearInterval(keepalive);
        clearTimeout(maxLifetime);
        unsubscribe();
      };

      controller.enqueue(encoder.encode(": connected\n\n"));

      const unsubscribe = subscribe((notification) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(notification)}\n\n`));
        } catch {
          cleanup();
        }
      });

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          cleanup();
        }
      }, 30_000);

      // Force-close after MAX_CONNECTION_MS to prevent leaked connections
      const maxLifetime = setTimeout(() => {
        try {
          controller.enqueue(encoder.encode(": reconnect\n\n"));
          controller.close();
        } catch { /* already closed */ }
        cleanup();
      }, MAX_CONNECTION_MS);

      // Store cleanup for cancel
      (controller as unknown as Record<string, unknown>).__cleanup = cleanup;
    },
    cancel(controller) {
      const fn = (controller as unknown as Record<string, unknown>).__cleanup as (() => void) | undefined;
      fn?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
