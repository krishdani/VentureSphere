// Fast path-level gate: unauthenticated users or the wrong role get a real 307 redirect
// before any page renders. Pages, route handlers and server actions still re-check
// everything against the database — this is not the only line of defence.
import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/token";

const AREAS: { prefix: string; role?: "STARTUP" | "VC" }[] = [
  { prefix: "/startup", role: "STARTUP" },
  { prefix: "/vc", role: "VC" },
  { prefix: "/notifications" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const area = AREAS.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
  if (!area) return NextResponse.next();
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.redirect(new URL("/login", req.url));
  if (area.role && session.role !== area.role) {
    return NextResponse.redirect(new URL(session.role === "VC" ? "/vc" : "/startup", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/startup/:path*", "/vc/:path*", "/notifications"] };
