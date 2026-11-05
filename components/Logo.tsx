import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-lg text-ink" aria-label="VentureSphere home">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <defs>
          <linearGradient id="vs-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#vs-g)" />
        <circle cx="16" cy="16" r="7.5" fill="none" stroke="#fff" strokeWidth="2.2" />
        <path d="M8.5 16h15M16 8.5c2.6 2.2 3.6 4.7 3.6 7.5s-1 5.3-3.6 7.5c-2.6-2.2-3.6-4.7-3.6-7.5s1-5.3 3.6-7.5Z" fill="none" stroke="#fff" strokeWidth="1.6" />
      </svg>
      <span className="text-lg font-bold tracking-tight">VentureSphere</span>
    </Link>
  );
}
