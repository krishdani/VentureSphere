import { type DealStatus, STATUS_LABELS } from "@/lib/constants";

const STYLES: Record<DealStatus, string> = {
  SHORTLISTED: "bg-amber-100 text-amber-900 ring-amber-300/60 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/30",
  SELECTED: "bg-indigo-100 text-indigo-900 ring-indigo-300/60 dark:bg-indigo-400/15 dark:text-indigo-200 dark:ring-indigo-400/30",
  FUNDED: "bg-emerald-100 text-emerald-900 ring-emerald-300/60 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-400/30",
  PASSED: "bg-slate-100 text-slate-700 ring-slate-300/60 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/30",
};
const DOTS: Record<DealStatus, string> = {
  SHORTLISTED: "bg-amber-500",
  SELECTED: "bg-indigo-500",
  FUNDED: "bg-emerald-500",
  PASSED: "bg-slate-400",
};

export function StatusBadge({ status }: { status: string }) {
  const s = (status in STYLES ? status : "PASSED") as DealStatus;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[s]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[s]}`} aria-hidden />
      {STATUS_LABELS[s] ?? status}
    </span>
  );
}
