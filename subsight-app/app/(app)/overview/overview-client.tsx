"use client";

import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Btn, AIDot, Icon, ServiceMark } from "@/components/primitives";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { fmtINR } from "@/lib/utils";
import type { Subscription, Renewal } from "@/lib/mock-data";

function PulseStat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  const c = tone === "ai" ? "text-ai" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="rounded-xl bg-bg-soft hairline p-4 min-w-0 overflow-hidden">
      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-faint mb-2 truncate">{label}</div>
      <div className={`text-[18px] xl:text-[20px] tabular-nums tracking-tight truncate ${c}`} style={{ letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div className="text-[10.5px] font-mono text-ink-faint mt-1 truncate">{sub}</div>
    </div>
  );
}

interface Props {
  subscriptions: Subscription[];
  renewals: Renewal[];
  greeting: string;
}

export function OverviewClient({ subscriptions, renewals, greeting }: Props) {
  const [chatOpen, setChatOpen] = useState(false);

  const active = subscriptions.filter((s) => s.active);
  const totalMonthly = active.reduce((a, s) => a + (s.cycle === "mo" ? s.price : s.price / 12), 0);
  const flagged = subscriptions.filter((s) => s.tag);

  const categories = Array.from(new Set(subscriptions.map((s) => s.cat)));
  const byCat = categories
    .map((cat) => ({
      cat,
      spend: subscriptions.filter((s) => s.cat === cat && s.active).reduce((a, s) => a + (s.cycle === "mo" ? s.price : s.price / 12), 0),
      count: subscriptions.filter((s) => s.cat === cat && s.active).length,
    }))
    .filter((c) => c.spend > 0)
    .sort((a, b) => b.spend - a.spend);
  const maxSpend = Math.max(...byCat.map((c) => c.spend));

  const recentActivity = [
    { who: "AI", icon: "sparkles", text: "Detected new recurring charge: GitHub Copilot Business · ₹1,670/mo", when: "2h ago", tone: "ai" },
    { who: "AI", icon: "shield-check", text: "Confirmed Spotify renewal is identical to last cycle. No action.", when: "5h ago", tone: "neutral" },
    { who: "You", icon: "pause", text: "Paused Hotstar for one cycle", when: "yesterday", tone: "neutral" },
    { who: "AI", icon: "alarm-clock", text: "Midjourney trial flagged — converts in 2 days", when: "yesterday", tone: "warn" },
    { who: "AI", icon: "trending-up", text: "Adobe price increased ₹420 vs last cycle", when: "2 days ago", tone: "warn" },
  ];

  return (
    <div className="flex-1 min-w-0">
      <Topbar
        title={greeting}
        subtitle={`Live · 4 accounts · ${active.length} active subscriptions`}
        actions={
          <>
            <Btn size="sm" kind="soft" icon="message-square" onClick={() => setChatOpen(true)}>Ask AI</Btn>
            <Link href="/insights"><Btn size="sm" kind="ai" icon="sparkles">Today&apos;s brief</Btn></Link>
          </>
        }
      />

      <AIChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* AI brief card */}
      <div className="px-6 lg:px-8 pt-6">
        <div className="rounded-2xl bg-bg-card hairline-ai relative overflow-hidden ai-scan">
          <div className="p-6 lg:p-8 grid lg:grid-cols-[1.4fr_1fr] gap-8">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-ai mb-3 inline-flex items-center gap-2">
                <AIDot size={5} /> {"// Daily brief · 6:42 am IST"}
              </div>
              <h2
                className="text-[24px] lg:text-[28px] tracking-tight text-ink leading-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                You&apos;re paying{" "}
                <span className="font-serif italic text-ai">{fmtINR(Math.round(totalMonthly))}/mo</span>{" "}
                across {active.length} active subscriptions. Three of them want your attention.
              </h2>
              <div className="mt-5 space-y-2">
                {flagged.slice(0, 3).map((s) => (
                  <Link key={s.id} href="/subscriptions" className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-bg-soft hairline hover:hairline-strong block">
                    <ServiceMark name={s.name} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] text-ink">{s.name}</div>
                      <div className="text-[11px] text-ink-faint font-mono truncate">{s.insight}</div>
                    </div>
                    <Icon name="arrow-right" size={14} className="text-ink-faint" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PulseStat label="Monthly burn" value={fmtINR(Math.round(totalMonthly))} sub="vs ₹16,810 last cycle" />
              <PulseStat label="AI flagged" value={String(flagged.length)} sub="6 actions drafted" tone="warn" />
              <PulseStat label="Yearly impact" value={fmtINR(Math.round(totalMonthly * 12))} sub="projected" />
              <PulseStat label="Recoverable" value={fmtINR(6748)} sub="per month · ₹80,976/yr" tone="ai" />
            </div>
          </div>
        </div>
      </div>

      {/* Category spend + renewals */}
      <div className="px-6 lg:px-8 pt-6 grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <section className="rounded-2xl bg-bg-card hairline p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-[14px] text-ink tracking-tight">Where your recurring spend lives</h3>
              <p className="text-[11.5px] text-ink-faint mt-0.5">by category, last 30 days</p>
            </div>
            <Link href="/subscriptions" className="text-[11.5px] text-ink-mute hover:text-ink font-mono">view all →</Link>
          </div>
          <div className="space-y-2">
            {byCat.map((c) => {
              const pct = (c.spend / maxSpend) * 100;
              return (
                <div key={c.cat} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 py-1.5">
                  <div className="text-[12px] text-ink-dim">{c.cat}</div>
                  <div className="h-2 rounded-full bg-bg-soft overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${pct}%`, background: "linear-gradient(90deg, oklch(0.56 0.10 125), oklch(0.88 0.18 125))" }}
                    />
                  </div>
                  <div className="font-mono text-[11px] tabular-nums text-ink w-24 text-right">
                    {fmtINR(Math.round(c.spend))}<span className="text-ink-faint"> · {c.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-bg-card hairline p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-[14px] text-ink tracking-tight">Next 14 days</h3>
              <p className="text-[11.5px] text-ink-faint mt-0.5">upcoming renewals</p>
            </div>
            <Link href="/subscriptions" className="text-[11.5px] text-ink-mute hover:text-ink font-mono">view all →</Link>
          </div>
          <div className="divide-y divide-bg-edge">
            {renewals.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 py-2.5">
                <ServiceMark name={r.name} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-ink">{r.name}</div>
                  <div className="text-[10.5px] font-mono text-ink-faint">{r.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] tabular-nums text-ink">{fmtINR(r.price)}</div>
                  <div className={`text-[10px] font-mono ${i < 2 ? "text-ai" : "text-ink-faint"}`}>{r.in}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent AI activity */}
      <div className="px-6 lg:px-8 pt-6 pb-10">
        <div className="rounded-2xl bg-bg-card hairline p-5">
          <h3 className="text-[14px] text-ink tracking-tight mb-1">Recent AI activity</h3>
          <p className="text-[11.5px] text-ink-faint mb-4">what your co-pilot did while you weren&apos;t looking</p>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  a.tone === "ai" ? "bg-ai/10 text-ai" : a.tone === "warn" ? "bg-warn/10 text-warn" : "bg-bg-soft text-ink-mute"
                }`}>
                  <Icon name={a.icon} size={13} />
                </span>
                <div className="flex-1">
                  <div className="text-[12.5px] text-ink leading-snug">
                    <span className={`font-mono text-[10px] uppercase tracking-wider mr-2 ${a.who === "AI" ? "text-ai" : "text-ink-faint"}`}>
                      {a.who}
                    </span>
                    {a.text}
                  </div>
                </div>
                <span className="text-[10.5px] font-mono text-ink-faint">{a.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
