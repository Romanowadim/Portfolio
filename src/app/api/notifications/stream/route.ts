import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin";
import { subscribe } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(": connected\n\n"));

      const unsubscribe = subscribe((notification) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(notification)}\n\n`));
        } catch {
          unsubscribe();
        }
      });

      // Keepalive every 30s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
          unsubscribe();
        }
      }, 30_000);

      // Cleanup when client disconnects
      const cleanup = () => {
        clearInterval(keepalive);
        unsubscribe();
      };

      // Store cleanup for cancel
      (controller as unknown as Record<string, unknown>).__cleanup = cleanup;
    },
    cancel(controller) {
      const cleanup = (controller as unknown as Record<string, unknown>).__cleanup as (() => void) | undefined;
      cleanup?.();
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
