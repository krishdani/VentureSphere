export const ROLES = ["STARTUP", "VC"] as const;
export type Role = (typeof ROLES)[number];

export const SECTORS = [
  "AI/ML",
  "Fintech",
  "Healthtech",
  "SaaS",
  "Climate",
  "Consumer",
  "Edtech",
  "Deeptech",
  "Marketplace",
  "Other",
] as const;
export type Sector = (typeof SECTORS)[number];

export const STAGES = ["IDEA", "PRE_SEED", "SEED", "SERIES_A_PLUS"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  IDEA: "Idea",
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A_PLUS: "Series A+",
};

export const DEAL_STATUSES = ["SHORTLISTED", "SELECTED", "FUNDED", "PASSED"] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const DEAL_ACTIONS = ["SHORTLIST", "SELECT", "FUND", "PASS"] as const;
export type DealAction = (typeof DEAL_ACTIONS)[number];

export const STATUS_LABELS: Record<DealStatus, string> = {
  SHORTLISTED: "Shortlisted",
  SELECTED: "Selected",
  FUNDED: "Funded",
  PASSED: "Passed",
};

export const MAX_DECK_BYTES = 10 * 1024 * 1024;

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage as Stage] ?? stage;
}

export function formatUsd(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount >= 1_000_000) return `$${+(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${+(amount / 1_000).toFixed(1)}K`;
  return `$${amount}`;
}
