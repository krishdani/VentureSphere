import { handle, json } from "@/lib/http";
import { getActor } from "@/lib/session";
import { listNotifications, markNotificationsRead } from "@/lib/services";

export const GET = handle(async () => json({ notifications: await listNotifications(await getActor()) }));

/** Mark all as read. */
export const POST = handle(async () => {
  await markNotificationsRead(await getActor());
  return json({ ok: true });
});
