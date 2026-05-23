"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/mock-data";
import { Logo, Icon, AIDot } from "@/components/primitives";
import { signOut } from "@/lib/actions/auth";
import { useAuth } from "@/lib/hooks/useAuth";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDisplayName(user: { email?: string | null; user_metadata?: { full_name?: string } } | null): string {
  if (!user) return "User";
  return user.user_metadata?.full_name ?? user.email ?? "User";
}

export function Sidebar() {
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const { user, loading } = useAuth();

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  // In dev mode without credentials, show mock user
  const displayName = hasSupabase ? getDisplayName(user) : "Aanya Rao";
  const displayEmail = hasSupabase ? (user?.email ?? "") : "aanya@acme.in";
  const initials = getInitials(displayName);

  return (
    <aside className="hidden lg:flex w-[232px] flex-col gap-1 px-3 py-4 border-r border-bg-edge bg-bg shrink-0 sticky top-0 h-screen">
      <div className="px-2 pt-1 pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <Logo size={20} />
        </Link>
        <span className="font-mono text-[9.5px] text-ink-faint tracking-wider">v1.4</span>
      </div>

      <div className="px-2 pb-2">
        <button className="w-full flex items-center gap-2 px-2 h-9 rounded-lg hairline bg-bg-soft text-ink-mute text-[12.5px] hover:bg-bg-card">
          <Icon name="search" size={14} />
          <span>Search…</span>
          <span className="ml-auto font-mono text-[10px] text-ink-faint">⌘K</span>
        </button>
      </div>

      <nav className="flex flex-col gap-[2px]">
        {NAV.map((n) => {
          const on = pathname === `/${n.id}` || pathname.startsWith(`/${n.id}/`);
          return (
            <Link
              key={n.id}
              href={`/${n.id}`}
              className={cn(
                "flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13px] tracking-tight transition",
                on ? "bg-bg-card text-ink hairline" : "text-ink-mute hover:text-ink hover:bg-bg-soft"
              )}
            >
              <Icon name={n.icon} size={15} />
              <span>{n.label}</span>
              {n.id === "insights" && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono text-ai">
                  <AIDot size={4} />6
                </span>
              )}
              {n.id === "gmail" && <span className="ml-auto text-[10px] font-mono text-good">live</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 py-3 rounded-xl bg-bg-soft hairline">
        <div className="flex items-center gap-2 text-[11px] text-ink-mute font-mono">
          <AIDot size={5} /> AI co-pilot · active
        </div>
        <div className="mt-2 text-[12px] text-ink-dim leading-snug">
          Watching 4 accounts and 1 inbox.{" "}
          <span className="text-ink">15 subs</span> under review.
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 py-2 mt-1 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-bg-card hairline flex items-center justify-center text-[11px] font-medium shrink-0">
          {loading && hasSupabase ? "…" : initials}
        </div>
        <div className="flex-1 leading-tight min-w-0">
          <div className="text-[12.5px] text-ink truncate">
            {loading && hasSupabase ? "Loading…" : displayName}
          </div>
          <div className="text-[10.5px] text-ink-faint font-mono truncate">{displayEmail}</div>
        </div>
        <button
          title="Sign out"
          onClick={() => startTransition(() => signOut())}
          className="w-6 h-6 rounded-md hover:bg-bg-edge flex items-center justify-center shrink-0 text-ink-faint hover:text-ink transition"
        >
          <Icon name="log-out" size={13} />
        </button>
      </div>
    </aside>
  );
}
