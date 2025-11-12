// middleware.ts
import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const { pathname } = new URL(req.url);

  // Släpp igenom publika offert-endpoints; de sköter egen säkerhet
  if (pathname.startsWith("/api/offert/create") || pathname.startsWith("/api/offert/ticket")) {
    return NextResponse.next();
  }

  // ...övrigt middleware (ev. JWT-skydd för admin mm)...
  return NextResponse.next();
}
