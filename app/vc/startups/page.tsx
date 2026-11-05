import { Search, SearchX, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StartupCard } from "@/components/StartupCard";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { SECTORS, STAGES, STAGE_LABELS } from "@/lib/constants";
import { requirePageUser } from "@/lib/session";
import { browseStartups, getOwnVcProfile } from "@/lib/services";
import { browseSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Discover startups" };

export default async function BrowsePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePageUser("VC");
  const raw = await searchParams;
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== "" && v != null));
  const parsed = browseSchema.safeParse(cleaned);
  const filters = parsed.success ? parsed.data : {};
  const [startups, vc] = await Promise.all([browseStartups(user, filters), getOwnVcProfile(user)]);
  const filtered = ["q", "sector", "stage", "minRaise", "maxRaise"].some((k) => cleaned[k]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="Deal flow" title="Discover startups" description="Search and filter every startup raising on VentureSphere." />
      <div className="mt-6 space-y-3">
        {raw.saved && <Notice tone="success">Firm profile saved. Happy hunting!</Notice>}
        {!vc && (
          <Notice tone="warning">
            <Link href="/vc/profile" className="font-semibold underline underline-offset-4">Set up your firm profile</Link> before shortlisting startups.
          </Notice>
        )}
      </div>

      <form className="card mt-6 p-4 sm:p-5" method="get" role="search">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
            <input className="input pl-9" name="q" placeholder="Search name, pitch, location…" defaultValue={raw.q ?? ""} aria-label="Search startups" />
          </div>
          <select className="input md:col-span-2" name="sector" defaultValue={raw.sector ?? ""} aria-label="Sector">
            <option value="">All sectors</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input md:col-span-2" name="stage" defaultValue={raw.stage ?? ""} aria-label="Stage">
            <option value="">All stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
          <input className="input md:col-span-2" name="minRaise" type="number" min={0} step={1000} placeholder="Min raise ($)" defaultValue={raw.minRaise ?? ""} aria-label="Minimum raise in USD" />
          <input className="input md:col-span-2" name="maxRaise" type="number" min={0} step={1000} placeholder="Max raise ($)" defaultValue={raw.maxRaise ?? ""} aria-label="Maximum raise in USD" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="btn-primary"><SlidersHorizontal className="h-4 w-4" aria-hidden /> Apply filters</button>
          {filtered && <Link href="/vc/startups" className="btn-ghost">Clear</Link>}
          <p className="ml-auto text-sm text-ink-subtle" aria-live="polite">
            {startups.length} startup{startups.length === 1 ? "" : "s"}
          </p>
        </div>
      </form>

      <div className="mt-6">
        {startups.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={filtered ? "No startups match these filters" : "No startups yet"}
            action={filtered ? <Link href="/vc/startups" className="btn-secondary">Clear filters</Link> : undefined}
          >
            {filtered ? "Try a broader search or a wider raise range." : "Check back soon — founders are listing every day."}
          </EmptyState>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" data-testid="startup-results">
            {startups.map((s) => (
              <li key={s.id}>
                <StartupCard s={s} href={`/vc/startups/${s.id}`} status={s.myStatus} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
