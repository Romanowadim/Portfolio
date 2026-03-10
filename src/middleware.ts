import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";
import { verifyToken } from "./lib/admin";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  const token = request.cookies.get("admin-token")?.value;
  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload) response.headers.set("x-is-admin", "true");
    } catch { /* invalid token — skip */ }
  }

  return response;
}

export const config = {
  matcher: ["/", "/(ru|en)/:path*"],
};
