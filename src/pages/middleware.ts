// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Tillåt publika endpoints utan auth
  if (
    pathname.startsWith("/api/offert/create") ||
    pathname.startsWith("/api/bookings/create") ||
    pathname.startsWith("/api/debug/email") ||   // valfri
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // …din övriga auth-logik här (session/JWT etc) …
  return NextResponse.next();
}

// Matcher för allt (standard), men vi låter tidigt return i funktionen släppa igenom ovan
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
