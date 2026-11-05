import { Briefcase, Telescope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, PageHeader } from "@/components/ui";
import { DEAL_STATUSES, formatUsd, stageLabel } from "@/lib/constants";
import { requirePageUser } from "@/lib/session";
import { getOwnVcProfile, listDeals } from "@/lib/services";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const user = await requirePageUser("VC");
  const vc = await getOwnVcProfile(user);
  if (!vc) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState icon={Briefcase} title={`Welcome, ${user.name}`} action={<Link href="/vc/profile" className="btn-primary">Set up firm profile</Link>}>
          Tell founders who you are and what you back, then start building your pipeline.
        </EmptyState>
      </main>
    );
  }
  const deals = await listDeals(user);
  const funded = deals.filter((d) => d.status === "FUNDED");
  const committed = funded.reduce((sum, d) => sum + (d.offeredAmount ?? 0), 0);
  const active = deals.filter((d) => d.status === "SHORTLISTED" || d.status === "SELECTED").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow={vc.firmName}
        title="Pipeline"
        description="Every startup you've acted on, by stage."
        actions={<Link href="/vc/startups" className="btn-primary"><Telescope className="h-4 w-4" aria-hidden /> Discover startups</Link>}
      />
      <dl className="mt-6 grid grid-cols-3 gap-4">
        {[
          ["Active deals", String(active)],
          ["Funded", String(funded.length)],
          ["Capital deployed", formatUsd(committed)],
        ].map(([k, v]) => (
          <div key={k} className="card p-4 sm:p-5">
            <dt className="text-xs text-ink-subtle">{k}</dt>
            <dd className="mt-1 text-xl font-bold sm:text-2xl">{v}</dd>
          </div>
        ))}
      </dl>
      {deals.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Telescope} title="Your pipeline is empty" action={<Link href="/vc/startups" className="btn-primary">Browse startups</Link>}>
            Shortlist startups you like and they&apos;ll appear here.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {DEAL_STATUSES.map((status) => {
            const column = deals.filter((d) => d.status === status);
            return (
              <section key={status} className="rounded-2xl border border-line bg-surface-muted/60 p-3" aria-label={status}>
                <div className="mb-3 flex items-center justify-between px-1">
                  <StatusBadge status={status} />
                  <span className="text-sm font-semibold text-ink-subtle">{column.length}</span>
                </div>
                <ul className="space-y-2">
                  {column.map((d) => (
                    <li key={d.id}>
                      <Link href={`/vc/startups/${d.startupId}`} className="block rounded-xl border border-line bg-surface p-3.5 shadow-xs transition hover:border-brand/40 hover:shadow-sm">
                        <p className="font-semibold text-ink">{d.startup.name}</p>
                        <p className="mt-0.5 text-xs text-ink-subtle">
                          {d.startup.sector} · {stageLabel(d.startup.stage)} · raising {formatUsd(d.startup.raisingAmount)}
                        </p>
                        {d.offeredAmount ? <p className="mt-2 text-xs font-semibold text-link">Offer {formatUsd(d.offeredAmount)}</p> : null}
                      </Link>
                    </li>
                  ))}
                  {column.length === 0 && <li className="rounded-xl border border-dashed border-line-strong px-3 py-6 text-center text-xs text-ink-subtle">Nothing here yet</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
