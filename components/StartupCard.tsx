import { ArrowRight, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { formatUsd, stageLabel } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import { Tag } from "./ui";

export type StartupCardData = {
  id: string;
  name: string;
  oneLiner: string;
  sector: string;
  stage: string;
  location: string;
  raisingAmount: number;
  teamSize: number;
};

export function StartupCard({ s, href, status }: { s: StartupCardData; href?: string; status?: string | null }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-base font-bold text-white" aria-hidden>
            {s.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-ink">{s.name}</h3>
            <p className="text-xs text-ink-subtle">
              {s.sector} · {stageLabel(s.stage)}
            </p>
          </div>
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      <p className="mt-4 line-clamp-2 min-h-10 text-sm text-ink-muted">{s.oneLiner}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Tag icon={MapPin}>{s.location}</Tag>
        <Tag icon={Users}>{s.teamSize} people</Tag>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <div>
          <p className="text-xs text-ink-subtle">Raising</p>
          <p className="font-semibold text-ink">{formatUsd(s.raisingAmount)}</p>
        </div>
        {href && <ArrowRight className="h-4 w-4 text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-link" aria-hidden />}
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="card group block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      {body}
    </Link>
  ) : (
    <div className="card h-full p-5">{body}</div>
  );
}
