import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/infrastructure/auth/env";
import { JoseSessionTokenService } from "@/infrastructure/auth/JoseSessionTokenService";

const tokenService = new JoseSessionTokenService();

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isAuthenticated = token
    ? (await tokenService.verify(token)) !== null
    : false;

  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/analyses/new"],
};
