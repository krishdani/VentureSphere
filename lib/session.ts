import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Actor } from "./access";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./auth";
import type { Role } from "./constants";
import { prisma } from "./db";

export async function createSession(user: { id: string; role: Role }) {
  const token = await signSession({ userId: user.id, role: user.role });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Secure by default in production. Set COOKIE_SECURE=false to run `npm start` over plain http.
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The logged-in user, re-read from the DB (role is never trusted from the cookie alone). */
export const getCurrentUser = cache(async () => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return null;
  return { ...user, role: user.role as Role };
});

export async function getActor(): Promise<Actor> {
  const user = await getCurrentUser();
  return user ? { id: user.id, role: user.role } : null;
}

/** For pages: redirect to login (or the right home) instead of throwing. */
export async function requirePageUser(role?: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(user.role === "VC" ? "/vc" : "/startup");
  return user;
}
