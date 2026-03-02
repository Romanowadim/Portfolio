import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";
import { verifyToken } from "./lib/admin";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  let isAdmin = false;
  if (token) {
    const payload = await verifyToken(token);
    isAdmin = !!payload;
  }

  const response = intlMiddleware(request);

  if (isAdmin) {
    response.headers.set("x-is-admin", "true");
  }

  return response;
}

export const config = {
  matcher: ["/", "/(ru|en)/:path*"],
};
