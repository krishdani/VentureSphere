import { requireRole } from "@/lib/access";
import { handle, json, readBody } from "@/lib/http";
import { getActor } from "@/lib/session";
import { getOwnVcProfile, upsertOwnVcProfile } from "@/lib/services";
import { vcProfileSchema } from "@/lib/validation";

export const GET = handle(async () => json({ vcProfile: await getOwnVcProfile(await getActor()) }));

export const PUT = handle(async (req: Request) => {
  const actor = await getActor();
  requireRole(actor, "VC");
  const input = vcProfileSchema.parse(await readBody(req, ["sectors", "stages"]));
  return json({ vcProfile: await upsertOwnVcProfile(actor, input) });
});
