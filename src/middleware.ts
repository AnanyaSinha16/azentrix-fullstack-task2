import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/register"];
const ADMIN_ROUTES = ["/team-members", "/activity-logs"];
const APP_ROUTES = ["/dashboard", "/boards", "/board", "/my-tasks", "/analytics", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes to handle their own auth
  if (pathname.startsWith("/api")) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
