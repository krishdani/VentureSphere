import { Bell, BellOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MarkRead } from "@/components/MarkRead";
import { EmptyState, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/lib/session";
import { listNotifications } from "@/lib/services";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requirePageUser();
  const notifications = await listNotifications(user);
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <MarkRead hasUnread={unread > 0} />
      <PageHeader title="Notifications" description={unread ? `${unread} new` : "You're all caught up."} />
      <div className="mt-8">
        {notifications.length === 0 ? (
          <EmptyState icon={BellOff} title="No notifications yet">
            {user.role === "STARTUP"
              ? "You'll hear here the moment an investor shortlists, selects or funds you."
              : "Updates about your account will appear here."}
          </EmptyState>
        ) : (
          <ul className="card divide-y divide-line p-0">
            {notifications.map((n) => (
              <li key={n.id} className={`flex items-start gap-4 p-4 sm:p-5 ${n.read ? "" : "bg-brand-soft/60"}`}>
                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${n.read ? "bg-surface-muted text-ink-subtle" : "bg-brand text-white"}`}>
                  <Bell className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    {!n.read && <span className="sr-only">New: </span>}
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">{n.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                {n.link && <Link href={n.link} className="link shrink-0 text-sm">View</Link>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
