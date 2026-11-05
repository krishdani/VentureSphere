import { handle, json, readBody } from "@/lib/http";
import { getActor } from "@/lib/session";
import { getStartupForViewer, updateStartup } from "@/lib/services";
import { startupProfileSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return json(await getStartupForViewer(await getActor(), id));
});

/** Owner only. */
export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const actor = await getActor();
  const input = startupProfileSchema.parse(await readBody(req));
  return json({ startup: await updateStartup(actor, id, input) });
});
