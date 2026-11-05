"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { AppError } from "@/lib/access";
import { createSession, destroySession, getActor } from "@/lib/session";
import {
  actOnDeal,
  authenticate,
  markNotificationsRead,
  registerUser,
  upsertOwnStartup,
  upsertOwnVcProfile,
} from "@/lib/services";
import {
  dealActionSchema,
  firstError,
  formToObject,
  loginSchema,
  signupSchema,
  startupProfileSchema,
  vcProfileSchema,
} from "@/lib/validation";

// Every page is dynamically rendered (no data cache), so actions don't call revalidatePath; the
// client refreshes the current route after an action instead (see useFormAction).
export type ActionState = { error?: string; ok?: string; fieldErrors?: Record<string, string> } | undefined;

async function run(fn: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      const count = Object.keys(fieldErrors).length;
      return { error: count > 1 ? "Please fix the highlighted fields." : firstError(err), fieldErrors };
    }
    console.error(err);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function signupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let role: string | undefined;
  const result = await run(async () => {
    const input = signupSchema.parse(formToObject(form));
    const user = await registerUser(input);
    await createSession(user);
    role = user.role;
    return undefined;
  });
  if (result?.error) return result;
  redirect(role === "VC" ? "/vc/profile?welcome=1" : "/startup/profile?welcome=1");
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let role: string | undefined;
  const result = await run(async () => {
    const input = loginSchema.parse(formToObject(form));
    const user = await authenticate(input.email, input.password);
    await createSession(user);
    role = user.role;
    return undefined;
  });
  if (result?.error) return result;
  redirect(role === "VC" ? "/vc" : "/startup");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function saveStartupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await run(async () => {
    const actor = await getActor();
    const input = startupProfileSchema.parse(formToObject(form));
    const file = form.get("deck");
    const blobPathname = form.get("deckBlob");
    const deckName = form.get("deckName");
    const deck =
      typeof blobPathname === "string" && blobPathname
        ? { blobPathname }
        : file instanceof File
          ? file
          : null;
    await upsertOwnStartup(actor, input, deck, typeof deckName === "string" && deckName ? deckName : undefined);
    return undefined;
  });
  if (result?.error) return result;
  redirect("/startup?saved=1");
}

export async function saveVcAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await run(async () => {
    const actor = await getActor();
    const input = vcProfileSchema.parse(formToObject(form, ["sectors", "stages"]));
    await upsertOwnVcProfile(actor, input);
    return undefined;
  });
  if (result?.error) return result;
  redirect("/vc/startups?saved=1");
}

export async function dealAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const actor = await getActor();
    const input = dealActionSchema.parse(formToObject(form));
    const deal = await actOnDeal(actor, input);
    return { ok: `Marked as ${deal.status.toLowerCase()}.` };
  });
}

export async function markReadAction() {
  const actor = await getActor();
  if (!actor) return;
  await markNotificationsRead(actor);
}
