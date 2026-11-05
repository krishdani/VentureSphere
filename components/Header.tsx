import { Bell, Briefcase, Kanban, LayoutDashboard, LogOut, Menu, Pencil, Telescope, UserRound } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/session";
import { unreadCount } from "@/lib/services";
import { Logo } from "./Logo";

export async function Header() {
  const user = await getCurrentUser();
  const unread = user ? await unreadCount(user) : 0;
  const links =
    user?.role === "VC"
      ? [
          { href: "/vc/startups", label: "Discover", icon: Telescope },
          { href: "/vc", label: "Pipeline", icon: Kanban },
          { href: "/vc/profile", label: "Firm profile", icon: Briefcase },
        ]
      : user?.role === "STARTUP"
        ? [
            { href: "/startup", label: "Dashboard", icon: LayoutDashboard },
            { href: "/startup/profile", label: "Company & pitch", icon: Pencil },
          ]
        : [];

  const bell = user && (
    <Link
      href="/notifications"
      className="btn-ghost relative px-2.5"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
    >
      <Bell className="h-5 w-5" aria-hidden />
      {unread > 0 && (
        <span
          data-testid="notification-badge"
          className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white ring-2 ring-surface"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />

        {/* Desktop */}
        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="btn-ghost px-3">
              <l.icon className="h-4 w-4" aria-hidden />
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              {bell}
              <span className="mx-2 h-6 w-px bg-line" aria-hidden />
              <span className="flex items-center gap-2 text-sm text-ink-muted">
                <UserRound className="h-4 w-4" aria-hidden />
                <span className="max-w-32 truncate">{user.name}</span>
              </span>
              <form action={logoutAction}>
                <button className="btn-ghost px-2.5" aria-label="Log out" title="Log out">
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/signup" className="btn-primary">Get started</Link>
            </>
          )}
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          {bell}
          {!user && <Link href="/login" className="btn-ghost px-3">Log in</Link>}
          <details className="group relative">
            <summary className="btn-ghost cursor-pointer list-none px-2.5 [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" aria-hidden />
            </summary>
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-line bg-surface p-2 shadow-lg">
              {user && <p className="truncate px-3 py-2 text-xs text-ink-subtle">Signed in as {user.name}</p>}
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="btn-ghost w-full justify-start">
                  <l.icon className="h-4 w-4" aria-hidden />
                  {l.label}
                </Link>
              ))}
              {user ? (
                <form action={logoutAction}>
                  <button className="btn-ghost w-full justify-start">
                    <LogOut className="h-4 w-4" aria-hidden />
                    Log out
                  </button>
                </form>
              ) : (
                <>
                  <Link href="/signup?role=STARTUP" className="btn-ghost w-full justify-start">Sign up as a startup</Link>
                  <Link href="/signup?role=VC" className="btn-ghost w-full justify-start">Sign up as a VC</Link>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
