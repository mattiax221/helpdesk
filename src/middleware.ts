import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isAuthPage = pathname.startsWith("/login");
  const isProtected =
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/lab");

  if (!token && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (token && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = token.role === "TEACHER" ? "/teacher" : "/student";
    return NextResponse.redirect(url);
  }

  if (token && pathname.startsWith("/teacher") && token.role !== "TEACHER") {
    const url = req.nextUrl.clone();
    url.pathname = "/student";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/teacher/:path*", "/student/:path*", "/lab/:path*"],
};
