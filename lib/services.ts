// Data operations. Every function takes the acting user and enforces access control
// itself, so route handlers and server actions can't forget a check.
import type { Prisma } from "@prisma/client";
import {
  type Actor,
  AppError,
  assertCanEditStartup,
  assertCanViewStartup,
  requireActor,
  requireRole,
} from "./access";
import { hashPassword, verifyPassword } from "./auth";
import { type DealStatus, type Role, STATUS_LABELS, formatUsd } from "./constants";
import { nextStatus } from "./deals";
import { prisma } from "./db";
import { deleteDeck, readDeck, saveDeck, verifyUploadedBlob } from "./uploads";
import type { BrowseFilters, DealActionInput, StartupProfileInput, VcProfileInput } from "./validation";

// ---------- auth ----------

export async function registerUser(input: { name: string; email: string; password: string; role: Role }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, "An account with that email already exists.");
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
  });
  return { id: user.id, role: user.role as Role, name: user.name, email: user.email };
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always run bcrypt to avoid leaking which emails exist via timing.
  const ok = await verifyPassword(password, user?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!user || !ok) throw new AppError(401, "Invalid email or password.");
  return { id: user.id, role: user.role as Role, name: user.name, email: user.email };
}

// ---------- startups ----------

export async function getOwnStartup(actor: Actor) {
  requireRole(actor, "STARTUP");
  return prisma.startup.findUnique({ where: { ownerId: actor.id } });
}

/** A deck upload: a File (server upload) or a pathname the browser uploaded to Vercel Blob. */
export type DeckInput = File | { blobPathname: string } | null | undefined;

async function storeDeckInput(deck: DeckInput): Promise<{ deckFile: string; deckOriginal: string } | null> {
  if (!deck) return null;
  if (deck instanceof File) {
    if (deck.size === 0) return null; // empty file input = "keep current deck"
    return { deckFile: await saveDeck(deck), deckOriginal: safeName(deck.name) };
  }
  const deckFile = await verifyUploadedBlob(deck.blobPathname);
  const taken = await prisma.startup.findUnique({ where: { deckFile } });
  if (taken) throw new AppError(409, "That upload is already in use.");
  return { deckFile, deckOriginal: "pitch-deck.pdf" };
}

/** Create or update the acting startup user's own profile. */
export async function upsertOwnStartup(actor: Actor, input: StartupProfileInput, deck?: DeckInput, deckName?: string) {
  requireRole(actor, "STARTUP");
  const existing = await prisma.startup.findUnique({ where: { ownerId: actor.id } });
  if (existing) return updateStartup(actor, existing.id, input, deck, deckName);
  const deckFields = await storeDeckInput(deck);
  if (deckFields && deckName) deckFields.deckOriginal = safeName(deckName);
  return prisma.startup.create({
    data: { ...normalize(input), ...(deckFields ?? {}), ownerId: actor.id },
  });
}

/** Update a startup by id — only its owner may do this. */
export async function updateStartup(
  actor: Actor,
  startupId: string,
  input: StartupProfileInput,
  deck?: DeckInput,
  deckName?: string,
) {
  requireActor(actor);
  const startup = await prisma.startup.findUnique({ where: { id: startupId } });
  if (!startup) throw new AppError(404, "Startup not found.");
  assertCanEditStartup(actor, startup);
  const deckFields = await storeDeckInput(deck);
  if (deckFields && deckName) deckFields.deckOriginal = safeName(deckName);
  const updated = await prisma.startup.update({
    where: { id: startupId },
    data: { ...normalize(input), ...(deckFields ?? {}) },
  });
  if (deckFields) await deleteDeck(startup.deckFile);
  return updated;
}

/** Replace just the deck — owner only. */
export async function uploadDeck(actor: Actor, startupId: string, deck: DeckInput, deckName?: string) {
  requireActor(actor);
  const startup = await prisma.startup.findUnique({ where: { id: startupId } });
  if (!startup) throw new AppError(404, "Startup not found.");
  assertCanEditStartup(actor, startup);
  const deckFields = await storeDeckInput(deck);
  if (!deckFields) throw new AppError(400, "Attach a PDF deck.");
  if (deckName) deckFields.deckOriginal = safeName(deckName);
  const updated = await prisma.startup.update({ where: { id: startupId }, data: deckFields });
  await deleteDeck(startup.deckFile);
  return updated;
}

export async function getDeck(actor: Actor, startupId: string) {
  requireActor(actor);
  const startup = await prisma.startup.findUnique({ where: { id: startupId } });
  if (!startup || !startup.deckFile) throw new AppError(404, "Deck not found.");
  assertCanViewStartup(actor, startup);
  return { ...(await readDeck(startup.deckFile)), filename: startup.deckOriginal || "deck.pdf" };
}

export async function getStartupForViewer(actor: Actor, startupId: string) {
  requireActor(actor);
  const startup = await prisma.startup.findUnique({ where: { id: startupId } });
  if (!startup) throw new AppError(404, "Startup not found.");
  assertCanViewStartup(actor, startup);
  let myDeal = null;
  if (actor.role === "VC") {
    const vc = await prisma.vcProfile.findUnique({ where: { userId: actor.id } });
    if (vc) myDeal = await prisma.deal.findUnique({ where: { vcId_startupId: { vcId: vc.id, startupId } } });
  }
  return { startup, myDeal };
}

export async function browseStartups(actor: Actor, f: BrowseFilters) {
  requireRole(actor, "VC");
  const where: Prisma.StartupWhereInput = {};
  if (f.sector) where.sector = f.sector;
  if (f.stage) where.stage = f.stage;
  if (f.minRaise != null || f.maxRaise != null) {
    where.raisingAmount = {
      ...(f.minRaise != null ? { gte: f.minRaise } : {}),
      ...(f.maxRaise != null ? { lte: f.maxRaise } : {}),
    };
  }
  if (f.q) {
    where.OR = [
      { name: { contains: f.q, mode: "insensitive" } },
      { oneLiner: { contains: f.q, mode: "insensitive" } },
      { pitchText: { contains: f.q, mode: "insensitive" } },
      { location: { contains: f.q, mode: "insensitive" } },
    ];
  }
  const vc = await prisma.vcProfile.findUnique({ where: { userId: actor.id } });
  const startups = await prisma.startup.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { deals: { where: { vcId: vc?.id ?? "" }, select: { status: true } } },
  });
  return startups.map(({ deals, ...s }) => ({
    ...s,
    myStatus: (deals[0]?.status as DealStatus | undefined) ?? null,
  }));
}

export async function featuredStartups(limit = 3) {
  return prisma.startup.findMany({
    where: { featured: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, name: true, oneLiner: true, sector: true, stage: true, location: true, raisingAmount: true, teamSize: true },
  });
}

export async function platformStats() {
  const [startups, vcs, funded] = await Promise.all([
    prisma.startup.count(),
    prisma.vcProfile.count(),
    prisma.deal.count({ where: { status: "FUNDED" } }),
  ]);
  return { startups, vcs, funded };
}

// ---------- VC ----------

export async function getOwnVcProfile(actor: Actor) {
  requireRole(actor, "VC");
  return prisma.vcProfile.findUnique({ where: { userId: actor.id } });
}

export async function upsertOwnVcProfile(actor: Actor, input: VcProfileInput) {
  requireRole(actor, "VC");
  const data = {
    firmName: input.firmName,
    thesis: input.thesis,
    chequeMin: input.chequeMin,
    chequeMax: input.chequeMax,
    sectors: input.sectors.join(","),
    stages: input.stages.join(","),
  };
  return prisma.vcProfile.upsert({
    where: { userId: actor.id },
    create: { ...data, userId: actor.id },
    update: data,
  });
}

// ---------- deals ----------

/** Apply a VC action (shortlist/select/fund/pass) to the (VC, startup) deal. VC only. */
export async function actOnDeal(actor: Actor, input: DealActionInput) {
  requireRole(actor, "VC");
  const vc = await prisma.vcProfile.findUnique({ where: { userId: actor.id } });
  if (!vc) throw new AppError(400, "Set up your VC profile before acting on startups.");
  const startup = await prisma.startup.findUnique({ where: { id: input.startupId } });
  if (!startup) throw new AppError(404, "Startup not found.");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.deal.findUnique({
      where: { vcId_startupId: { vcId: vc.id, startupId: startup.id } },
    });
    const status = nextStatus((existing?.status as DealStatus | undefined) ?? null, input.action);
    const data = {
      status,
      ...(input.offeredAmount !== undefined ? { offeredAmount: input.offeredAmount } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    };
    const deal = existing
      ? await tx.deal.update({ where: { id: existing.id }, data })
      : await tx.deal.create({ data: { ...data, vcId: vc.id, startupId: startup.id } });

    let message = `${vc.firmName} marked ${startup.name} as ${STATUS_LABELS[status]}.`;
    if (status === "SELECTED" && deal.offeredAmount) message += ` Offer: ${formatUsd(deal.offeredAmount)}.`;
    if (status === "FUNDED") message = `${vc.firmName} funded ${startup.name}${deal.offeredAmount ? ` (${formatUsd(deal.offeredAmount)})` : ""}!`;
    await tx.notification.create({ data: { userId: startup.ownerId, message, link: "/startup" } });
    return deal;
  });
}

export async function listDeals(actor: Actor) {
  requireActor(actor);
  if (actor.role === "VC") {
    const vc = await prisma.vcProfile.findUnique({ where: { userId: actor.id } });
    if (!vc) return [];
    return prisma.deal.findMany({
      where: { vcId: vc.id },
      orderBy: { updatedAt: "desc" },
      include: { startup: true, vc: { select: { firmName: true } } },
    });
  }
  const startup = await prisma.startup.findUnique({ where: { ownerId: actor.id } });
  if (!startup) return [];
  return prisma.deal.findMany({
    where: { startupId: startup.id },
    orderBy: { updatedAt: "desc" },
    include: { startup: true, vc: { select: { firmName: true } } },
  });
}

// ---------- notifications ----------

export async function unreadCount(actor: Actor): Promise<number> {
  if (!actor) return 0;
  return prisma.notification.count({ where: { userId: actor.id, read: false } });
}

export async function listNotifications(actor: Actor) {
  requireActor(actor);
  return prisma.notification.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationsRead(actor: Actor) {
  requireActor(actor);
  await prisma.notification.updateMany({ where: { userId: actor.id, read: false }, data: { read: true } });
}

// ---------- helpers ----------

function normalize(input: StartupProfileInput) {
  return {
    name: input.name,
    oneLiner: input.oneLiner,
    sector: input.sector,
    stage: input.stage,
    location: input.location,
    website: input.website ?? null,
    teamSize: input.teamSize,
    raisingAmount: input.raisingAmount,
    traction: input.traction,
    pitchText: input.pitchText,
    videoUrl: input.videoUrl ?? null,
  };
}

function safeName(name: string): string {
  return (name || "deck.pdf").replace(/[^\w.\- ]+/g, "_").slice(0, 120);
}
