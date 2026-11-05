import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/access";
import { availableActions, canTransition, nextStatus } from "@/lib/deals";
import { dealActionSchema } from "@/lib/validation";

describe("deal status transitions", () => {
  it("follows the happy path Shortlist → Select → Fund", () => {
    const s1 = nextStatus(null, "SHORTLIST");
    expect(s1).toBe("SHORTLISTED");
    const s2 = nextStatus(s1, "SELECT");
    expect(s2).toBe("SELECTED");
    expect(nextStatus(s2, "FUND")).toBe("FUNDED");
  });

  it("allows selecting directly and passing at any open stage", () => {
    expect(nextStatus(null, "SELECT")).toBe("SELECTED");
    expect(nextStatus(null, "PASS")).toBe("PASSED");
    expect(nextStatus("SHORTLISTED", "PASS")).toBe("PASSED");
    expect(nextStatus("SELECTED", "PASS")).toBe("PASSED");
  });

  it("lets a VC reconsider a passed startup", () => {
    expect(nextStatus("PASSED", "SHORTLIST")).toBe("SHORTLISTED");
  });

  it("rejects invalid jumps with a 409", () => {
    const bad: [Parameters<typeof nextStatus>[0], Parameters<typeof nextStatus>[1]][] = [
      [null, "FUND"],
      ["SHORTLISTED", "FUND"],
      ["SHORTLISTED", "SHORTLIST"],
      ["SELECTED", "SHORTLIST"],
      ["PASSED", "FUND"],
      ["PASSED", "SELECT"],
      ["FUNDED", "PASS"],
      ["FUNDED", "SHORTLIST"],
    ];
    for (const [from, action] of bad) {
      expect(canTransition(from, action)).toBe(false);
      try {
        nextStatus(from, action);
        expect.unreachable(`${from} -${action}-> should fail`);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).status).toBe(409);
      }
    }
  });

  it("lists the available actions per status", () => {
    expect(availableActions(null)).toEqual(["SHORTLIST", "SELECT", "PASS"]);
    expect(availableActions("SHORTLISTED")).toEqual(["SELECT", "PASS"]);
    expect(availableActions("SELECTED")).toEqual(["FUND", "PASS"]);
    expect(availableActions("PASSED")).toEqual(["SHORTLIST"]);
    expect(availableActions("FUNDED")).toEqual([]);
  });
});

describe("deal action input", () => {
  it("treats offeredAmount and note as optional", () => {
    expect(dealActionSchema.parse({ startupId: "s1", action: "SHORTLIST" })).toEqual({ startupId: "s1", action: "SHORTLIST" });
    expect(dealActionSchema.parse({ startupId: "s1", action: "SELECT", offeredAmount: "", note: "" })).toEqual({
      startupId: "s1",
      action: "SELECT",
    });
    expect(dealActionSchema.parse({ startupId: "s1", action: "SELECT", offeredAmount: "500000", note: " hi " })).toEqual({
      startupId: "s1",
      action: "SELECT",
      offeredAmount: 500000,
      note: "hi",
    });
  });
  it("rejects unknown actions and negative offers", () => {
    expect(dealActionSchema.safeParse({ startupId: "s1", action: "STEAL" }).success).toBe(false);
    expect(dealActionSchema.safeParse({ startupId: "s1", action: "SELECT", offeredAmount: -5 }).success).toBe(false);
  });
});
