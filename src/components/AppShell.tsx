"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Bot,
  Compass,
  FileStack,
  FolderKanban,
  Gauge,
  Languages,
  LayoutGrid,
  LogOut,
  Map,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import { useToast, cn, IconButton, Spinner } from "@/components/ui";

type NavItem = { href: string; label: string; icon: ReactNode; group: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <Gauge className="size-[18px]" />, group: "Overview" },
  { href: "/profile", label: "Profile", icon: <UserRound className="size-[18px]" />, group: "Overview" },
  { href: "/skills", label: "Skills & Languages", icon: <Languages className="size-[18px]" />, group: "Your record" },
  { href: "/projects", label: "Projects", icon: <FolderKanban className="size-[18px]" />, group: "Your record" },
  { href: "/documents", label: "Documents", icon: <FileStack className="size-[18px]" />, group: "Your record" },
  { href: "/analyzer", label: "Career Analyzer", icon: <Compass className="size-[18px]" />, group: "Grow" },
  { href: "/roadmaps", label: "Roadmaps", icon: <Map className="size-[18px]" />, group: "Grow" },
  { href: "/assistant", label: "Nexus AI", icon: <Bot className="size-[18px]" />, group: "Grow" },
  { href: "/resume", label: "Résumé Builder", icon: <FileStack className="size-[18px]" />, group: "Grow" },
  { href: "/notifications", label: "Notifications", icon: <Bell className="size-[18px]" />, group: "Account" },
  { href: "/settings", label: "Settings", icon: <Settings className="size-[18px]" />, group: "Account" },
];

const GROUPS = ["Overview", "Your record", "Grow", "Account"];

function Wordmark({ dark }: { dark?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.9)]">
        <LayoutGrid className="size-[18px]" />
      </span>
      <span className="leading-tight">
        <span className={cn("block font-display text-[15px] font-semibold tracking-tight", dark ? "text-white" : "text-ink-900")}>
          Career Nexus
        </span>
        <span className={cn("block text-[10.5px] tracking-[0.14em] uppercase", dark ? "text-white/45" : "text-ink-400")}>
          Build your path
        </span>
      </span>
    </Link>
  );
}

function Shell({
  children,
  user,
  initialUnread,
}: {
  children: ReactNode;
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
  initialUnread: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [unread, setUnread] = useState(initialUnread);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const data = await api<{ unread: number }>("/api/notifications?summary=1");
        if (alive) setUnread(data.unread);
      } catch {
        /* a background poll failure must never break the shell */
      }
    };
    const id = window.setInterval(tick, 60_000);
    const onFocus = () => void tick();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      toast.success("Signed out", "Your session has been revoked.");
      router.push("/login");
      router.refresh();
    } catch (e) {
      setLoggingOut(false);
      toast.error("Could not sign out", errorMessage(e));
    }
  }

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-4">
      {GROUPS.map((group) => (
        <div key={group} className="mb-2">
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold tracking-[0.18em] text-white/35 uppercase">
            {group}
          </p>
          {NAV.filter((n) => n.group === group).map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all",
                  active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90",
                )}
              >
                {active ? (
                  <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-400" />
                ) : null}
                <span className={cn("transition-colors", active ? "text-brand-300" : "text-white/45 group-hover:text-brand-300")}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === "/notifications" && unread > 0 ? (
                  <span className="grid min-w-5 place-items-center rounded-full bg-brand-500 px-1.5 py-0.5 text-[10.5px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <p className="text-[11px] leading-relaxed text-white/55">
          Discover your potential. Build your path. Define your future.
        </p>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="grain sticky top-0 hidden h-screen flex-col bg-ink-900 lg:flex">
        <div className="border-b border-white/10 px-5 py-4">
          <Wordmark dark />
        </div>
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="grain animate-pop absolute inset-y-0 left-0 flex w-[280px] flex-col bg-ink-900">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <Wordmark dark />
              <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white">
                <X className="size-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200/70 bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <button
            className="grid size-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Wordmark />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            >
              <Bell className="size-[18px]" />
              {unread > 0 ? (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-flare-500 ring-2 ring-white" />
              ) : null}
            </Link>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white py-1 pr-2.5 pl-1 transition-colors hover:border-ink-300"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="size-7 rounded-lg object-cover" />
                ) : (
                  <span className="grid size-7 place-items-center rounded-lg bg-ink-900 text-[11px] font-semibold text-white">
                    {initials}
                  </span>
                )}
                <span className="hidden max-w-[10rem] truncate text-[13px] font-medium text-ink-800 sm:block">
                  {user.fullName}
                </span>
              </button>

              {menuOpen ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                  <div
                    role="menu"
                    className="animate-pop absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lift"
                  >
                    <div className="border-b border-ink-100 px-4 py-3">
                      <p className="truncate text-[13.5px] font-semibold text-ink-900">{user.fullName}</p>
                      <p className="truncate text-[12px] text-ink-500">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-700 hover:bg-ink-50"
                    >
                      <UserRound className="size-4 text-ink-400" /> Edit profile
                    </Link>
                    <Link
                      href="/settings"
                      role="menuitem"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-700 hover:bg-ink-50"
                    >
                      <Settings className="size-4 text-ink-400" /> Account settings
                    </Link>
                    <button
                      role="menuitem"
                      onClick={logout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2.5 border-t border-ink-100 px-4 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {loggingOut ? <Spinner className="size-4" /> : <LogOut className="size-4" />} Sign out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>

        <footer className="border-t border-ink-200/70 px-6 py-5 text-center text-[12px] text-ink-400">
          Career Nexus · Your data stays in your account. Every action on this app writes to the database.
        </footer>
      </div>
    </div>
  );
}

export default function AppShell(props: {
  children: ReactNode;
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
  initialUnread: number;
}) {
  return (
    <Shell {...props} />
  );
}

export { IconButton };
