// Session-token helpers (jose only, so they also run in middleware / the edge runtime).
import { jwtVerify, SignJWT } from "jose";
import { ROLES, type Role } from "./constants";

export const SESSION_COOKIE = "vs_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = { userId: string; role: Role };

const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-change-me-please-0123456789";

export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
      throw new Error("AUTH_SECRET must be set (32+ chars) in production");
    }
    return new TextEncoder().encode(secret && secret.length >= 32 ? secret : DEV_FALLBACK_SECRET);
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(
  payload: SessionPayload,
  secret: Uint8Array = getAuthSecret(),
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(secret);
}

export async function verifySession(
  token: string | undefined | null,
  secret: Uint8Array = getAuthSecret(),
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const role = payload.role;
    if (typeof payload.sub !== "string" || !ROLES.includes(role as Role)) return null;
    return { userId: payload.sub, role: role as Role };
  } catch {
    return null;
  }
}
