import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-ink-subtle">Connecting ambitious startups with the investors who back them.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted" aria-label="Footer">
          <Link href="/signup?role=STARTUP" className="hover:text-ink">For startups</Link>
          <Link href="/signup?role=VC" className="hover:text-ink">For VCs</Link>
          <Link href="/login" className="hover:text-ink">Log in</Link>
        </nav>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-ink-subtle">© {new Date().getFullYear()} VentureSphere</p>
    </footer>
  );
}
