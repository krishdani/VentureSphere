// Pure auth helpers (no Next.js imports) so they are unit-testable.
import bcrypt from "bcryptjs";

export * from "./token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

