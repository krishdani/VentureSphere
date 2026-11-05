import { AppError } from "@/lib/access";
import { handle, json } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";
import { unreadCount } from "@/lib/services";

export const GET = handle(async () => {
  const user = await getCurrentUser();
  if (!user) throw new AppError(401, "You need to log in.");
  return json({ user, unreadNotifications: await unreadCount(user) });
});
