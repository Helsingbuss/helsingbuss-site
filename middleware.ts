// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = { matcher: ["/api/:path*"] };

export function middleware(_req: NextRequest) {
  // släpper igenom allt
  return NextResponse.next();
}
