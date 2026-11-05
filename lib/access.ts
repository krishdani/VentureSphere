// Pure access-control policy. Every route handler / server action goes through these.
import type { Role } from "./constants";

export type Actor = { id: string; role: Role } | null;

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function requireActor(actor: Actor): asserts actor is NonNullable<Actor> {
  if (!actor) throw new AppError(401, "You need to log in.");
}

export function requireRole(actor: Actor, role: Role): asserts actor is NonNullable<Actor> {
  requireActor(actor);
  if (actor.role !== role) {
    throw new AppError(403, role === "VC" ? "Only VCs can do this." : "Only startups can do this.");
  }
}

/** Only the owning startup user may edit a startup. */
export function canEditStartup(actor: Actor, startup: { ownerId: string }): boolean {
  return !!actor && actor.role === "STARTUP" && actor.id === startup.ownerId;
}

/** Only VCs may create or change deals. */
export function canActOnDeals(actor: Actor): boolean {
  return !!actor && actor.role === "VC";
}

/** VCs can browse startups and their pitches; a startup can only see its own. */
export function canViewStartup(actor: Actor, startup: { ownerId: string }): boolean {
  if (!actor) return false;
  return actor.role === "VC" || actor.id === startup.ownerId;
}

export function assertCanEditStartup(actor: Actor, startup: { ownerId: string }): void {
  requireActor(actor);
  if (!canEditStartup(actor, startup)) throw new AppError(403, "You can only edit your own startup.");
}

export function assertCanViewStartup(actor: Actor, startup: { ownerId: string }): void {
  requireActor(actor);
  if (!canViewStartup(actor, startup)) throw new AppError(403, "You don't have access to this startup.");
}
