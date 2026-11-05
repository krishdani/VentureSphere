// Deal status state machine (pure).
//   (none) --SHORTLIST--> SHORTLISTED --SELECT--> SELECTED --FUND--> FUNDED
//   SHORTLIST/SELECT may also be done directly from (none); PASS is allowed from
//   any non-funded state, and a PASSED deal can be re-shortlisted.
import { AppError } from "./access";
import type { DealAction, DealStatus } from "./constants";

const TRANSITIONS: Record<DealAction, { from: (DealStatus | null)[]; to: DealStatus }> = {
  SHORTLIST: { from: [null, "PASSED"], to: "SHORTLISTED" },
  SELECT: { from: [null, "SHORTLISTED"], to: "SELECTED" },
  FUND: { from: ["SELECTED"], to: "FUNDED" },
  PASS: { from: [null, "SHORTLISTED", "SELECTED"], to: "PASSED" },
};

export function canTransition(current: DealStatus | null, action: DealAction): boolean {
  return TRANSITIONS[action]?.from.includes(current) ?? false;
}

export function nextStatus(current: DealStatus | null, action: DealAction): DealStatus {
  if (!canTransition(current, action)) {
    throw new AppError(409, `Can't ${action.toLowerCase()} a deal that is ${current ? current.toLowerCase() : "new"}.`);
  }
  return TRANSITIONS[action].to;
}

export function availableActions(current: DealStatus | null): DealAction[] {
  return (Object.keys(TRANSITIONS) as DealAction[]).filter((a) => canTransition(current, a));
}
