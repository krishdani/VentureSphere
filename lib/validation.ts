import { z } from "zod";
import { DEAL_ACTIONS, ROLES, SECTORS, STAGES } from "./constants";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.url({ protocol: /^https?$/, message: "Must be an http(s) URL" }).optional());
const money = z.coerce.number().int().min(0).max(10_000_000_000);

export const signupSchema = z.object({
  name: trimmed(100).min(1, "Name is required"),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(ROLES, { message: "Pick STARTUP or VC" }),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required").max(200),
});

export const startupProfileSchema = z.object({
  name: trimmed(100).min(1, "Company name is required"),
  oneLiner: trimmed(200).min(1, "One-liner is required"),
  sector: z.enum(SECTORS, { message: "Pick a sector" }),
  stage: z.enum(STAGES, { message: "Pick a stage" }),
  location: trimmed(100).min(1, "Location is required"),
  website: optionalUrl,
  teamSize: z.coerce.number().int().min(1, "Team size must be at least 1").max(100_000),
  raisingAmount: money,
  traction: trimmed(2000).default(""),
  pitchText: trimmed(20_000).default(""),
  videoUrl: optionalUrl,
});
export type StartupProfileInput = z.infer<typeof startupProfileSchema>;

export const vcProfileSchema = z
  .object({
    firmName: trimmed(100).min(1, "Firm name is required"),
    thesis: trimmed(5000).min(1, "Thesis is required"),
    chequeMin: money,
    chequeMax: money,
    sectors: z.array(z.enum(SECTORS)).default([]),
    stages: z.array(z.enum(STAGES)).default([]),
  })
  .refine((v) => v.chequeMax >= v.chequeMin, {
    message: "Max cheque must be ≥ min cheque",
    path: ["chequeMax"],
  });
export type VcProfileInput = z.infer<typeof vcProfileSchema>;

export const dealActionSchema = z.object({
  startupId: z.string().min(1),
  action: z.enum(DEAL_ACTIONS),
  offeredAmount: z.preprocess((v) => (v === "" || v == null ? undefined : v), money.optional()),
  note: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type DealActionInput = z.infer<typeof dealActionSchema>;

export const browseSchema = z.object({
  q: trimmed(100).optional(),
  sector: z.enum(SECTORS).optional().catch(undefined),
  stage: z.enum(STAGES).optional().catch(undefined),
  minRaise: z.coerce.number().int().min(0).optional().catch(undefined),
  maxRaise: z.coerce.number().int().min(0).optional().catch(undefined),
});
export type BrowseFilters = z.infer<typeof browseSchema>;

export function firstError(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? issue.message : "Invalid input";
}

/** Turn FormData into a plain object; keys listed in `multi` become arrays. */
export function formToObject(form: FormData, multi: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") continue;
    if (multi.includes(key)) {
      out[key] = [...((out[key] as string[]) ?? []), value];
    } else {
      out[key] = value;
    }
  }
  for (const key of multi) out[key] ??= [];
  return out;
}
