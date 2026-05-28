"use client";

import { useState, useEffect } from "react";
import { ServiceMark, Pill, AIDot } from "@/components/primitives";
import { fmtINR } from "@/lib/utils";

const ITEMS = [
  { name: "Netflix", plan: "Premium 4K", price: 649, tag: null, tone: "neutral" as const, renew: "in 6 days" },
  { name: "Adobe", plan: "Creative Cloud", price: 4719, tag: "Overspending", tone: "warn" as const, renew: "in 11 days" },
  { name: "Spotify", plan: "Family", price: 179, tag: "Renews soon", tone: "ai" as const, renew: "in 3 days" },
  { name: "Canva", plan: "Pro · 2nd workspace", price: 499, tag: "Duplicate", tone: "warn" as const, renew: "in 14 days" },
  { name: "ChatGPT", plan: "Plus", price: 1999, tag: "Overlap", tone: "warn" as const, renew: "in 13 days" },
  { name: "Figma", plan: "Professional", price: 1245, tag: "Yearly saves", tone: "good" as const, renew: "in 18 days" },
];

const INSIGHTS: Record<string, string> = {
  Overspending: "Photography plan covers what you actually use.",
  Duplicate: "Detected a duplicate billing on a second workspace.",
  "Renews soon": "Two of six family seats are inactive — safe to downgrade.",
  Overlap: "You also pay for Claude — usage skews 8× to Claude.",
  "Yearly saves": "Yearly plan saves ₹3,140 based on your 8-cycle pattern.",
};

export function HeroCardStack() {
  const [highlight, setHighlight] = useState(2);

  useEffect(() => {
    const t = setInterval(() => setHighlight((h) => (h + 1) % ITEMS.length), 1800);
    return () => clearInterval(t);
  }, []);

  const item = ITEMS[highlight];

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div
          className="absolute -inset-y-4 w-40 left-0 bg-gradient-to-r from-transparent via-ai/15 to-transparent"
          style={{ animation: "scan 3.4s ease-in-out infinite" }}
        />
      </div>

      <div className="rounded-2xl bg-bg-card hairline p-2 space-y-1.5 relative">
        {ITEMS.map((it, i) => (
          <div
            key={it.name}
            className={`rounded-xl p-3 flex items-center gap-3 transition-all duration-500 ${
              i === highlight ? "bg-bg-edge hairline-ai" : "bg-bg-soft hairline"
            }`}
          >
            <ServiceMark name={it.name} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-ink">{it.name}</span>
                <span className="text-[11px] text-ink-mute">{it.plan}</span>
              </div>
              <div className="text-[10.5px] text-ink-faint font-mono mt-0.5">{it.renew}</div>
            </div>
            {it.tag && <Pill tone={it.tone}>{it.tag}</Pill>}
            <div className="text-right">
              <div className="text-[13px] text-ink tabular-nums">
                {fmtINR(it.price)}<span className="text-ink-faint text-[10px]">/mo</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[calc(100%+12px)] hidden xl:block">
        <div className="w-[260px] rounded-xl bg-bg-card hairline-ai shadow-pop p-3.5 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <AIDot size={5} />
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-ai">Subsight AI</span>
          </div>
          <p className="text-[12.5px] text-ink-dim leading-relaxed">
            Renewal for <span className="text-ink">{item.name}</span> {item.renew}.{" "}
            {item.tag ? INSIGHTS[item.tag] : "Stable. No price change in 8 cycles."}
          </p>
        </div>
      </div>
    </div>
  );
}
