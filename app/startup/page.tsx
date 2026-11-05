import { Bell, FileText, Inbox, Pencil, Rocket, Telescope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, Notice, PageHeader, Tag } from "@/components/ui";
import { DEAL_STATUSES, formatUsd, stageLabel } from "@/lib/constants";
import { requirePageUser } from "@/lib/session";
import { getOwnStartup, listDeals, unreadCount } from "@/lib/services";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StartupDashboard({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await requirePageUser("STARTUP");
  const startup = await getOwnStartup(user);
  if (!startup) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={Rocket}
          title={`Welcome, ${user.name}`}
          action={<Link href="/startup/profile" className="btn-primary">Create company profile</Link>}
        >
          List your company and add your pitch so investors can discover you.
        </EmptyState>
      </main>
    );
  }
  const [deals, unread] = await Promise.all([listDeals(user), unreadCount(user)]);
  const counts = deals.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.status]: (acc[d.status] ?? 0) + 1 }), {});
  const missing = [!startup.pitchText && "written pitch", !startup.deckFile && "pitch deck"].filter(Boolean);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="Founder dashboard"
        title={startup.name}
        description={startup.oneLiner}
        actions={<Link href="/startup/profile" className="btn-secondary"><Pencil className="h-4 w-4" aria-hidden /> Edit profile &amp; pitch</Link>}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Tag>{startup.sector}</Tag>
        <Tag>{stageLabel(startup.stage)}</Tag>
        <Tag>{startup.location}</Tag>
        <Tag>Raising {formatUsd(startup.raisingAmount)}</Tag>
        {startup.deckFile && <Tag icon={FileText}>Deck uploaded</Tag>}
      </div>

      <div className="mt-6 space-y-3">
        {saved && <Notice tone="success">Your profile and pitch were saved.</Notice>}
        {missing.length > 0 && (
          <Notice tone="warning">
            Add your {missing.join(" and ")} to stand out to investors. <Link href="/startup/profile" className="font-semibold underline underline-offset-4">Complete it</Link>
          </Notice>
        )}
        {unread > 0 && (
          <Notice>
            <span className="inline-flex items-center gap-2"><Bell className="h-4 w-4 text-link" aria-hidden /> You have {unread} new update{unread === 1 ? "" : "s"}.</span>{" "}
            <Link href="/notifications" className="link">See notifications</Link>
          </Notice>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {DEAL_STATUSES.map((s) => (
          <div key={s} className="card p-5">
            <StatusBadge status={s} />
            <p className="mt-3 text-3xl font-bold text-ink">{counts[s] ?? 0}</p>
            <p className="text-xs text-ink-subtle">investor{(counts[s] ?? 0) === 1 ? "" : "s"}</p>
          </div>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="vc-interest">
        <h2 id="vc-interest" className="text-lg font-semibold text-ink">Investor activity</h2>
        <div className="mt-4">
          {deals.length === 0 ? (
            <EmptyState icon={Inbox} title="No investor activity yet">
              When a VC shortlists, selects or funds you, it shows up here — and you&apos;ll get a notification.
            </EmptyState>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="space-y-3 md:hidden">
                {deals.map((d) => (
                  <li key={d.id} className="card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{d.vc.firmName}</p>
                      <StatusBadge status={d.status} />
                    </div>
                    {d.offeredAmount ? <p className="mt-2 text-sm">Offer: <span className="font-semibold">{formatUsd(d.offeredAmount)}</span></p> : null}
                    {d.note && <p className="mt-2 text-sm text-ink-muted">“{d.note}”</p>}
                    <p className="mt-2 text-xs text-ink-subtle">Updated {d.updatedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
                  </li>
                ))}
              </ul>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
                <table className="w-full text-left text-sm" data-testid="vc-interactions">
                  <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-subtle">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Investor</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Offer</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Note</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {deals.map((d) => (
                      <tr key={d.id} className="align-top">
                        <td className="px-5 py-4 font-semibold text-ink">{d.vc.firmName}</td>
                        <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                        <td className="px-5 py-4 text-ink">{d.offeredAmount ? formatUsd(d.offeredAmount) : "—"}</td>
                        <td className="max-w-sm px-5 py-4 text-ink-muted">{d.note || "—"}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-ink-subtle">{d.updatedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
      <p className="mt-10 flex items-center gap-2 text-sm text-ink-subtle">
        <Telescope className="h-4 w-4" aria-hidden /> Your profile is visible to every investor on VentureSphere.
      </p>
    </main>
  );
}
