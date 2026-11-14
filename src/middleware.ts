import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminEmail } from "@/lib/roles";

function authSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = authSecret();

  // On Vercel the session cookie is `__Secure-authjs.session-token`.
  // getToken must use secureCookie=true or it looks for the wrong name and always redirects to /login.
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" ||
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production";

  const token = secret
    ? await getToken({
        req,
        secret,
        secureCookie: isHttps,
      })
    : null;

  const isAuthPage = pathname.startsWith("/login");
  const isProtected =
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/lab") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/guide");

  if (!token && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const admin = token?.role === "ADMIN" || isAdminEmail(typeof token?.email === "string" ? token.email : "");

  if (token && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = admin ? "/admin" : token.role === "TEACHER" ? "/teacher" : "/student";
    return NextResponse.redirect(url);
  }

  if (token && pathname.startsWith("/admin") && !admin) {
    const url = req.nextUrl.clone();
    url.pathname = token.role === "TEACHER" ? "/teacher" : "/student";
    return NextResponse.redirect(url);
  }

  if (token && pathname.startsWith("/teacher") && token.role !== "TEACHER" && !admin) {
    const url = req.nextUrl.clone();
    url.pathname = "/student";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/teacher/:path*", "/student/:path*", "/lab/:path*", "/admin/:path*", "/guide", "/guide/:path*"],
};
