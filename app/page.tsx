import {
  ArrowRight,
  BadgeDollarSign,
  Briefcase,
  Building2,
  FileText,
  Kanban,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { StartupCard } from "@/components/StartupCard";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser } from "@/lib/session";
import { featuredStartups, platformStats } from "@/lib/services";

const startupSteps = [
  { icon: Building2, title: "List your company", body: "Sector, stage, team, traction and how much you're raising — in minutes." },
  { icon: FileText, title: "Share your pitch", body: "A written narrative, your PDF deck and an optional demo video, kept private to investors." },
  { icon: BadgeDollarSign, title: "Get selected & funded", body: "Watch every VC's decision in real time, with their notes and offered amounts." },
];
const vcSteps = [
  { icon: Target, title: "Set your thesis", body: "Firm, cheque size, and the sectors and stages you back." },
  { icon: Search, title: "Discover deal flow", body: "Search and filter startups by sector, stage and raise size." },
  { icon: Kanban, title: "Run your pipeline", body: "Shortlist, select with an offer, mark funded — or pass, cleanly." },
];

export default async function Home() {
  const [user, featured, stats] = await Promise.all([getCurrentUser(), featuredStartups(3), platformStats()]);
  const home = user ? (user.role === "VC" ? "/vc/startups" : "/startup") : null;

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgb(99_102_241/0.18),transparent),radial-gradient(40rem_20rem_at_90%_10%,rgb(16_185_129/0.12),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-muted shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-link" aria-hidden />
              The marketplace for early-stage funding
            </p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Startups pitch.{" "}
              <span className="whitespace-nowrap bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-emerald-400">
                VCs fund.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
              VentureSphere gives founders one place to list their company and pitch to investors — and gives VCs a
              focused, filterable deal flow they can shortlist, select and fund.
            </p>
            {home ? (
              <div className="mt-8">
                <Link href={home} className="btn-primary px-6 py-3 text-base">
                  Go to your {user?.role === "VC" ? "deal flow" : "dashboard"} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup?role=STARTUP" className="btn-primary px-6 py-3 text-base">
                  <Rocket className="h-4 w-4" aria-hidden /> I&apos;m raising
                </Link>
                <Link href="/signup?role=VC" className="btn-secondary px-6 py-3 text-base">
                  <Briefcase className="h-4 w-4" aria-hidden /> I&apos;m investing
                </Link>
              </div>
            )}
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                ["Startups", stats.startups],
                ["Investors", stats.vcs],
                ["Deals funded", stats.funded],
              ].map(([label, n]) => (
                <div key={label}>
                  <dt className="text-xs text-ink-subtle">{label}</dt>
                  <dd className="text-2xl font-bold text-ink">{n}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Product preview */}
          <div aria-hidden className="relative hidden lg:block">
            <div className="card rotate-1 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Your pipeline</p>
                <span className="text-xs text-ink-subtle">Horizon Ventures</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  ["Nimbus AI", "AI/ML · Seed", "SHORTLISTED"],
                  ["MediBridge", "Healthtech · Series A+", "SELECTED"],
                  ["GreenLoop", "Climate · Pre-seed", "FUNDED"],
                ].map(([n, m, st]) => (
                  <div key={n} className="flex items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold">{n}</p>
                      <p className="text-xs text-ink-subtle">{m}</p>
                    </div>
                    <StatusBadge status={st} />
                  </div>
                ))}
              </div>
            </div>
            <div className="card absolute -bottom-20 -left-6 w-64 -rotate-2 p-4 shadow-xl">
              <p className="text-xs font-semibold text-accent">New update</p>
              <p className="mt-1 text-sm">Horizon Ventures selected MediBridge — offer $2M.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20" aria-labelledby="how">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="how" className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mt-3 text-ink-muted">Built for both sides of the table.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            { title: "For startups", steps: startupSteps, href: "/signup?role=STARTUP", cta: "List your startup", tint: "from-indigo-500/10" },
            { title: "For VCs", steps: vcSteps, href: "/signup?role=VC", cta: "Start discovering", tint: "from-emerald-500/10" },
          ].map((side) => (
            <div key={side.title} className={`card flex flex-col bg-gradient-to-b ${side.tint} to-transparent p-8`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-link">{side.title}</h3>
              <ol className="mt-6 flex-1 space-y-6">
                {side.steps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-link shadow-xs">
                      <step.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-ink">
                        <span className="text-ink-subtle">{i + 1}. </span>
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-muted">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {!user && (
                <Link href={side.href} className="btn-secondary mt-8 self-start">
                  {side.cta} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="border-y border-line bg-surface" aria-labelledby="featured">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="featured" className="text-3xl font-bold tracking-tight">Featured startups</h2>
                <p className="mt-2 text-ink-muted">A taste of who&apos;s raising on VentureSphere right now.</p>
              </div>
              {user?.role === "VC" ? (
                <Link href="/vc/startups" className="link inline-flex items-center gap-1">Browse all <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              ) : !user ? (
                <Link href="/signup?role=VC" className="link inline-flex items-center gap-1">Sign up as a VC to see full pitches <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              ) : null}
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {featured.map((s) => (
                <StartupCard key={s.id} s={s} href={user?.role === "VC" ? `/vc/startups/${s.id}` : undefined} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Deal flow */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">A transparent deal flow</h2>
            <p className="mt-3 text-ink-muted">
              Every interaction between a VC and a startup is one clear record. Founders see exactly where they stand —
              with the investor&apos;s note and offer — and get notified the moment anything changes.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-muted">
              <li className="flex gap-2"><ShieldCheck className="h-5 w-5 shrink-0 text-accent" aria-hidden /> Decks are private to signed-in investors — never public links.</li>
              <li className="flex gap-2"><ShieldCheck className="h-5 w-5 shrink-0 text-accent" aria-hidden /> Only VCs can move deals; only founders can edit their company.</li>
            </ul>
          </div>
          <div className="card p-8">
            <ol className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {["SHORTLISTED", "SELECTED", "FUNDED"].map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <StatusBadge status={s} />
                  {i < 2 && <ArrowRight className="hidden h-4 w-4 text-ink-subtle sm:block" aria-hidden />}
                </li>
              ))}
              <li className="flex items-center gap-3 sm:ml-2">
                <span className="text-sm text-ink-subtle">or</span>
                <StatusBadge status="PASSED" />
              </li>
            </ol>
            <p className="mt-6 text-sm text-ink-muted">
              VCs can select with an offered amount and a note, then mark the deal funded once the money is wired.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="mx-auto max-w-6xl px-4 pb-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 py-14 text-center text-white shadow-xl sm:px-12">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(30rem_15rem_at_80%_0%,rgb(16_185_129/0.35),transparent)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight">Your next round starts here</h2>
              <p className="mx-auto mt-3 max-w-xl text-indigo-100">Free to join for founders and investors.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/signup?role=STARTUP" className="btn bg-white px-6 py-3 text-base text-indigo-700 hover:bg-indigo-50">
                  Sign up as a startup
                </Link>
                <Link href="/signup?role=VC" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
                  Sign up as a VC
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
