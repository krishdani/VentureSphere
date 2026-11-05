import { ChevronLeft, ExternalLink, FileText, Globe, MapPin, Users, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DealActions } from "@/components/DealActions";
import { StatusBadge } from "@/components/StatusBadge";
import { Tag } from "@/components/ui";
import { AppError } from "@/lib/access";
import { type DealStatus, formatUsd, stageLabel } from "@/lib/constants";
import { availableActions } from "@/lib/deals";
import { requirePageUser } from "@/lib/session";
import { getOwnVcProfile, getStartupForViewer } from "@/lib/services";

export const metadata: Metadata = { title: "Startup" };

export default async function StartupDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser("VC");
  const { id } = await params;
  const data = await getStartupForViewer(user, id).catch((e) => {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  });
  const { startup: s, myDeal } = data;
  const vc = await getOwnVcProfile(user);
  const status = (myDeal?.status as DealStatus | undefined) ?? null;
  const deckUrl = `/api/startups/${s.id}/deck`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/vc/startups" className="btn-ghost -ml-3 mb-4 px-3">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Back to discover
      </Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-2xl font-bold text-white" aria-hidden>
                {s.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{s.name}</h1>
                <p className="mt-1 text-ink-muted">{s.oneLiner}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Tag>{s.sector}</Tag>
              <Tag>{stageLabel(s.stage)}</Tag>
              <Tag icon={MapPin}>{s.location}</Tag>
              <Tag icon={Users}>{s.teamSize} people</Tag>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-3">
              <Info label="Raising" value={<span className="text-lg">{formatUsd(s.raisingAmount)}</span>} />
              <Info label="Stage" value={stageLabel(s.stage)} />
              <Info
                label="Website"
                value={
                  s.website ? (
                    <a className="link inline-flex items-center gap-1 break-all" href={s.website} target="_blank" rel="noreferrer noopener">
                      <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {s.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </div>

          {s.traction && (
            <section className="card">
              <h2 className="font-semibold">Traction</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-muted">{s.traction}</p>
            </section>
          )}

          <section className="card">
            <h2 className="font-semibold">Pitch</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-muted">{s.pitchText || "The founders haven't written a pitch yet."}</p>
            {(s.deckFile || s.videoUrl) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {s.deckFile && (
                  <a className="btn-secondary" href={deckUrl} target="_blank" rel="noreferrer">
                    <FileText className="h-4 w-4" aria-hidden /> Open deck <ExternalLink className="h-3.5 w-3.5 text-ink-subtle" aria-hidden />
                  </a>
                )}
                {s.videoUrl && (
                  <a className="btn-secondary" href={s.videoUrl} target="_blank" rel="noreferrer noopener">
                    <Video className="h-4 w-4" aria-hidden /> Watch pitch video <ExternalLink className="h-3.5 w-3.5 text-ink-subtle" aria-hidden />
                  </a>
                )}
              </div>
            )}
            {s.deckFile && (
              <iframe title={`${s.name} pitch deck`} src={deckUrl} className="mt-5 hidden h-[640px] w-full rounded-xl border border-line bg-surface-muted md:block" />
            )}
          </section>
        </div>

        <aside>
          <div className="card lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Your decision</h2>
              {status ? <StatusBadge status={status} /> : <span className="text-xs text-ink-subtle">No decision yet</span>}
            </div>
            {myDeal?.offeredAmount ? (
              <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-sm">
                Offer: <span className="font-semibold">{formatUsd(myDeal.offeredAmount)}</span>
              </p>
            ) : null}
            <div className="mt-5">
              {vc ? (
                <DealActions startupId={s.id} actions={availableActions(status)} offeredAmount={myDeal?.offeredAmount ?? null} note={myDeal?.note ?? null} />
              ) : (
                <p className="text-sm text-ink-muted">
                  <Link href="/vc/profile" className="link">Set up your firm profile</Link> to shortlist or select this startup.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}
