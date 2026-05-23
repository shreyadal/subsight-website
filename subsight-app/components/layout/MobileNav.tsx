"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/primitives";
import { signOut } from "@/lib/actions/auth";

const TABS = [
  { id: "overview", label: "Home", icon: "home" },
  { id: "subscriptions", label: "Subs", icon: "layers" },
  { id: "insights", label: "AI", icon: "sparkles" },
  { id: "settings", label: "You", icon: "user" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-bg/95 backdrop-blur-md border-t border-bg-edge px-2 pt-1.5 pb-safe-bottom grid grid-cols-5 gap-1">
      {TABS.map((t) => {
        const on = pathname === `/${t.id}` || pathname.startsWith(`/${t.id}/`);
        return (
          <Link
            key={t.id}
            href={`/${t.id}`}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1.5 rounded-lg",
              on ? "text-ai" : "text-ink-mute"
            )}
          >
            <Icon name={t.icon} size={18} />
            <span className="text-[10px] font-mono">{t.label}</span>
          </Link>
        );
      })}
      <button
        onClick={() => startTransition(() => signOut())}
        className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-ink-mute hover:text-ink transition"
      >
        <Icon name="log-out" size={18} />
        <span className="text-[10px] font-mono">Sign out</span>
      </button>
    </nav>
  );
}
