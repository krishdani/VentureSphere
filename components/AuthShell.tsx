import { CircleCheck } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-2">
      <div className="hidden lg:block">
        <h2 className="text-3xl font-bold tracking-tight">Where new ventures meet the investors who back them.</h2>
        <ul className="mt-8 space-y-4 text-ink-muted">
          {[
            "Founders list once and pitch every investor on the platform.",
            "VCs filter by sector, stage and raise size — no inbox chaos.",
            "Every decision is tracked, with notes, offers and notifications.",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="card mx-auto w-full max-w-md p-8 shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-muted">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
