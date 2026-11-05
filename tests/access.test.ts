import { describe, expect, it } from "vitest";
import {
  AppError,
  assertCanEditStartup,
  canActOnDeals,
  canEditStartup,
  canViewStartup,
  requireRole,
} from "@/lib/access";

const founderA = { id: "a", role: "STARTUP" as const };
const founderB = { id: "b", role: "STARTUP" as const };
const vc = { id: "v", role: "VC" as const };
const startupOfA = { ownerId: "a" };

describe("startup editing", () => {
  it("lets the owner edit their own startup", () => {
    expect(canEditStartup(founderA, startupOfA)).toBe(true);
    expect(() => assertCanEditStartup(founderA, startupOfA)).not.toThrow();
  });

  it("blocks another startup from editing it", () => {
    expect(canEditStartup(founderB, startupOfA)).toBe(false);
    expect(() => assertCanEditStartup(founderB, startupOfA)).toThrowError(AppError);
    try {
      assertCanEditStartup(founderB, startupOfA);
    } catch (e) {
      expect((e as AppError).status).toBe(403);
    }
  });

  it("blocks VCs and anonymous users from editing startups", () => {
    expect(canEditStartup(vc, startupOfA)).toBe(false);
    expect(canEditStartup(null, startupOfA)).toBe(false);
    // a VC whose id happens to equal the owner id is still not allowed
    expect(canEditStartup({ id: "a", role: "VC" }, startupOfA)).toBe(false);
  });

  it("returns 401 for anonymous edits", () => {
    try {
      assertCanEditStartup(null, startupOfA);
      expect.unreachable();
    } catch (e) {
      expect((e as AppError).status).toBe(401);
    }
  });
});

describe("deal actions", () => {
  it("only VCs can act on deals", () => {
    expect(canActOnDeals(vc)).toBe(true);
    expect(canActOnDeals(founderA)).toBe(false);
    expect(canActOnDeals(null)).toBe(false);
  });

  it("requireRole throws 403 for the wrong role and 401 for anonymous", () => {
    expect(() => requireRole(vc, "VC")).not.toThrow();
    expect(() => requireRole(founderA, "VC")).toThrowError(/Only VCs/);
    try {
      requireRole(null, "VC");
    } catch (e) {
      expect((e as AppError).status).toBe(401);
    }
  });
});

describe("viewing startups", () => {
  it("VCs and the owner can view; other startups cannot", () => {
    expect(canViewStartup(vc, startupOfA)).toBe(true);
    expect(canViewStartup(founderA, startupOfA)).toBe(true);
    expect(canViewStartup(founderB, startupOfA)).toBe(false);
    expect(canViewStartup(null, startupOfA)).toBe(false);
  });
});
