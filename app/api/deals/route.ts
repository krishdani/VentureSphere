import { requireRole } from "@/lib/access";
import { handle, json, readBody } from "@/lib/http";
import { getActor } from "@/lib/session";
import { actOnDeal, listDeals } from "@/lib/services";
import { dealActionSchema } from "@/lib/validation";

/** VC: your pipeline. Startup: every VC interaction with your company. */
export const GET = handle(async () => json({ deals: await listDeals(await getActor()) }));

/** VC only: { startupId, action: SHORTLIST|SELECT|FUND|PASS, offeredAmount?, note? } */
export const POST = handle(async (req: Request) => {
  const actor = await getActor();
  requireRole(actor, "VC"); // check before parsing the body
  const input = dealActionSchema.parse(await readBody(req));
  return json({ deal: await actOnDeal(actor, input) });
});
