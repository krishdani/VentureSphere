import { handle, json, readBody } from "@/lib/http";
import { getActor } from "@/lib/session";
import { browseStartups, getOwnStartup, upsertOwnStartup } from "@/lib/services";
import { browseSchema, startupProfileSchema } from "@/lib/validation";

/** VC: browse/filter startups. ?q=&sector=&stage=&minRaise=&maxRaise= */
export const GET = handle(async (req: Request) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const filters = browseSchema.parse(params);
  return json({ startups: await browseStartups(await getActor(), filters) });
});

/** Startup: create (or update) your own company profile. Accepts JSON or multipart (with optional `deck`). */
export const POST = handle(async (req: Request) => {
  const actor = await getActor();
  await getOwnStartup(actor); // role check before reading a potentially large body
  const body = await readBody(req);
  const input = startupProfileSchema.parse(body);
  const deck = body.deck instanceof File ? body.deck : null;
  return json({ startup: await upsertOwnStartup(actor, input, deck) }, 201);
});
