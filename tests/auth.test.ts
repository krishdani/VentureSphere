import { describe, expect, it } from "vitest";
import { hashPassword, signSession, verifyPassword, verifySession } from "@/lib/auth";

const secret = new TextEncoder().encode("test-secret-test-secret-test-secret-123");
const otherSecret = new TextEncoder().encode("another-secret-another-secret-another-1");

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct horse battery");
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("s3cret-pass");
    expect(await verifyPassword("wrong-pass", hash)).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips user id and role", async () => {
    const token = await signSession({ userId: "u1", role: "VC" }, secret);
    expect(await verifySession(token, secret)).toEqual({ userId: "u1", role: "VC" });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession({ userId: "u1", role: "STARTUP" }, otherSecret);
    expect(await verifySession(token, secret)).toBeNull();
  });

  it("rejects a tampered token (role escalation)", async () => {
    const token = await signSession({ userId: "u1", role: "STARTUP" }, secret);
    const [h, p, s] = token.split(".");
    const payload = JSON.parse(Buffer.from(p, "base64url").toString());
    payload.role = "VC";
    const forged = [h, Buffer.from(JSON.stringify(payload)).toString("base64url"), s].join(".");
    expect(await verifySession(forged, secret)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSession({ userId: "u1", role: "VC" }, secret, -10);
    expect(await verifySession(token, secret)).toBeNull();
  });

  it("rejects missing or garbage tokens", async () => {
    expect(await verifySession(undefined, secret)).toBeNull();
    expect(await verifySession("", secret)).toBeNull();
    expect(await verifySession("not.a.jwt", secret)).toBeNull();
  });
});
