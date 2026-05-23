"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Btn, AIDot, Icon, ServiceMark, Pill, Confidence } from "@/components/primitives";
import { fmtINR, cn } from "@/lib/utils";
import type { Subscription, Insight, Renewal } from "@/lib/mock-data";

const TAG_LABELS: Record<string, string> = {
  overspend: "Overspending", duplicate: "Duplicate", overlap: "Overlap",
  "renew-soon": "Renews soon", trial: "Trial ending", underused: "Underused", "yearly-save": "Yearly saves",
};

function tagTone(tag: string | null): "warn" | "ai" | "good" | "neutral" {
  if (tag === "overspend" || tag === "duplicate" || tag === "overlap" || tag === "trial" || tag === "underused") return "warn";
  if (tag === "renew-soon") return "ai";
  if (tag === "yearly-save") return "good";
  return "neutral";
}

function SubscriptionCard({ s, expanded, onToggle }: { s: Subscription; expanded: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "group relative rounded-xl bg-bg-card hairline hover:hairline-strong overflow-hidden transition cursor-default",
        expanded && "ring-1 ring-bg-edge"
      )}
    >
      <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 p-4">
        <ServiceMark name={s.name} size={44} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14.5px] text-ink font-medium tracking-tight">{s.name}</span>
            <span className="text-[12px] text-ink-mute">{s.plan}</span>
            {!s.active && <Pill tone="neutral">Inactive</Pill>}
            {s.tag && <Pill tone={tagTone(s.tag)}>{TAG_LABELS[s.tag]}</Pill>}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11.5px] text-ink-faint font-mono tracking-tight">
            <span>{s.source}</span>
            <span className="text-bg-edge">·</span>
            <span>{s.cat}</span>
            <span className="text-bg-edge">·</span>
            <Confidence value={s.conf} />
          </div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-[15px] text-ink font-medium tabular-nums tracking-tight">
            {fmtINR(s.price)}<span className="text-ink-faint font-normal text-[11px]">/{s.cycle}</span>
          </div>
          <div className="text-[11px] text-ink-faint font-mono mt-0.5">
            {s.renew === "paused" ? "paused" : "renews " + s.renew}
          </div>
        </div>
        <div className="text-ink-faint group-hover:text-ink transition">
          <Icon name={expanded ? "chevron-up" : "chevron-down"} size={16} />
        </div>
      </div>

      {s.insight && (
        <div className="px-4 pb-3 -mt-1 flex items-start gap-2">
          <span className="mt-[5px]"><AIDot size={5} /></span>
          <p className="text-[12.5px] text-ink-dim leading-relaxed flex-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ai mr-2">AI</span>
            {s.insight}
          </p>
        </div>
      )}

      {expanded && (
        <div className="border-t border-bg-edge bg-bg-soft/50 px-4 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div><div className="text-[10px] font-mono uppercase text-ink-faint">Billed since</div><div className="text-[12.5px] text-ink mt-1">Aug 2023</div></div>
          <div><div className="text-[10px] font-mono uppercase text-ink-faint">Lifetime spend</div><div className="text-[12.5px] text-ink mt-1 tabular-nums">{fmtINR(s.price * 21)}</div></div>
          <div><div className="text-[10px] font-mono uppercase text-ink-faint">Last 3 charges</div><div className="text-[12.5px] text-ink mt-1 tabular-nums">{fmtINR(s.price)} · {fmtINR(s.price)} · {fmtINR(s.price)}</div></div>
          <div><div className="text-[10px] font-mono uppercase text-ink-faint">Frequency</div><div className="text-[12.5px] text-ink mt-1">{s.cycle === "mo" ? "Monthly · 28 day mean" : "Yearly"}</div></div>
          <div className="col-span-2 lg:col-span-4 flex items-center gap-2 pt-1 flex-wrap">
            <Btn size="sm" kind="soft" icon="pause">Pause for a cycle</Btn>
            <Btn size="sm" kind="soft" icon="bell">Remind 3 days before</Btn>
            <Btn size="sm" kind="soft" icon="external-link">Open billing portal</Btn>
            <Btn size="sm" kind="soft" icon="users">View usage</Btn>
            <Btn size="sm" kind="danger" icon="x">Cancel subscription</Btn>
            <Link href="/insights"><Btn size="sm" kind="ai" icon="sparkles">Ask AI to optimize</Btn></Link>
          </div>
        </div>
      )}
    </div>
  );
}

function RenewalRow({ r, i }: { r: Renewal; i: number }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <ServiceMark name={r.name} size={28} />
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] text-ink truncate">{r.name}</div>
        <div className="text-[10.5px] text-ink-faint font-mono">{r.date}</div>
      </div>
      <div className="text-right">
        <div className="text-[12px] text-ink tabular-nums">{fmtINR(r.price)}</div>
        <div className={cn("text-[10px] font-mono", i < 2 ? "text-ai" : "text-ink-faint")}>{r.in}</div>
      </div>
    </div>
  );
}

function InsightMini({ ins }: { ins: Insight }) {
  const toneMap: Record<string, "good" | "warn" | "ai"> = {
    savings: "good", yearly: "good", duplicate: "warn", overlap: "warn", underused: "warn", trial: "warn",
  };
  const labelMap: Record<string, string> = {
    savings: "Savings", yearly: "Yearly", duplicate: "Duplicate", overlap: "Overlap", underused: "Underused", trial: "Trial",
  };
  return (
    <Link href="/insights" className="block w-full text-left p-3 rounded-lg bg-bg-soft hairline hover:hairline-strong transition">
      <div className="flex items-center justify-between gap-2 mb-2">
        <Pill tone={toneMap[ins.kind] || "neutral"}>{labelMap[ins.kind]}</Pill>
        <span className="text-[11px] font-mono tabular-nums text-ink-dim">
          −{fmtINR(ins.amount)}<span className="text-ink-faint">/{ins.period}</span>
        </span>
      </div>
      <div className="text-[12.5px] text-ink leading-snug">{ins.title}</div>
    </Link>
  );
}

function AIAssistant() {
  const [msg, setMsg] = useState("");
  const [log, setLog] = useState([
    { who: "ai", text: "I see ChatGPT and Claude both billed monthly. Last 30 days you used Claude 142h vs ChatGPT 18h. Want me to pause ChatGPT until next month?" },
  ]);

  function send(t: string) {
    if (!t.trim()) return;
    setLog((l) => [...l, { who: "me", text: t }]);
    setMsg("");
    setTimeout(() => {
      setLog((l) => [...l, { who: "ai", text: "Done. I scheduled the pause for May 31 and silenced the renewal email. Net effect this cycle: −₹1,999." }]);
    }, 700);
  }

  return (
    <div className="rounded-xl bg-bg-card hairline overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-bg-edge flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AIDot size={5} />
          <span className="text-[11.5px] font-medium tracking-tight text-ink">AI co-pilot</span>
        </div>
        <Icon name="more-horizontal" size={14} className="text-ink-faint" />
      </div>
      <div className="p-3.5 space-y-3 max-h-[200px] overflow-y-auto">
        {log.map((m, i) => (
          <div key={i} className={`text-[12px] leading-relaxed ${m.who === "ai" ? "text-ink-dim" : "text-ink"}`}>
            {m.who === "ai" && <span className="text-ai font-mono text-[9.5px] uppercase tracking-wider mr-2">AI</span>}
            {m.who === "me" && <span className="text-ink-faint font-mono text-[9.5px] uppercase tracking-wider mr-2">you</span>}
            {m.text}
          </div>
        ))}
      </div>
      <div className="px-3 pt-1 flex gap-1.5 flex-wrap">
        {["Pause ChatGPT", "Switch Adobe plan", "Find duplicates"].map((s) => (
          <button key={s} onClick={() => send(s)} className="text-[11px] px-2 py-1 rounded-full hairline text-ink-dim hover:text-ink hover:bg-bg-soft">
            {s}
          </button>
        ))}
      </div>
      <div className="p-3 flex items-center gap-2">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(msg)}
          placeholder="Ask anything about your subscriptions…"
          className="flex-1 bg-bg-soft hairline rounded-lg px-3 h-9 text-[12.5px] placeholder:text-ink-faint focus:outline-none focus:hairline-ai"
        />
        <button onClick={() => send(msg)} className="h-9 w-9 rounded-lg bg-ai text-bg flex items-center justify-center hover:brightness-110">
          <Icon name="arrow-up" size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

const FILTERS = ["All", "AI flagged", "Streaming", "AI", "Software", "Productivity", "Inactive"];

interface Props {
  subscriptions: Subscription[];
  renewals: Renewal[];
  insights: Insight[];
}

export function SubscriptionsClient({ subscriptions, renewals, insights }: Props) {
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useMemo(() => {
    if (filter === "All") return subscriptions;
    if (filter === "AI flagged") return subscriptions.filter((s) => s.tag);
    if (filter === "Inactive") return subscriptions.filter((s) => !s.active);
    return subscriptions.filter((s) => s.cat === filter);
  }, [filter, subscriptions]);

  const totalMonthly = subscriptions.filter((s) => s.active).reduce((a, s) => a + (s.cycle === "mo" ? s.price : s.price / 12), 0);
  const flagged = subscriptions.filter((s) => s.tag).length;

  return (
    <div className="flex-1 min-w-0 grid grid-cols-1 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <Topbar
          title="Subscription Intelligence"
          subtitle="Live · 4 accounts · last synced 2 min ago"
          actions={
            <>
              <Btn size="sm" kind="soft" icon="filter">Filter</Btn>
              <Btn size="sm" kind="ai" icon="sparkles">Run AI sweep</Btn>
            </>
          }
        />

        {/* AI summary banner */}
        <div className="px-6 lg:px-8 pt-6">
          <div className="relative rounded-2xl bg-bg-card hairline overflow-hidden ai-scan">
            <div className="p-5 lg:p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Active subscriptions", value: String(subscriptions.filter((s) => s.active).length), delta: "+2 this month", tone: "neutral" },
                { label: "Monthly burn", value: fmtINR(Math.round(totalMonthly)), delta: "₹16,810 last cycle", tone: "neutral" },
                { label: "AI flagged", value: String(flagged), delta: "Across 6 categories", tone: "warn" },
                { label: "Potential savings", value: `${fmtINR(6748)}/mo`, delta: "₹80,976/yr", tone: "good", highlight: true },
              ].map((s) => (
                <div key={s.label} className={cn("min-w-0", s.highlight && "lg:border-l lg:border-bg-edge lg:pl-6")}>
                  <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-faint mb-2">{s.label}</div>
                  <div className={cn("text-[26px] tabular-nums tracking-tight", s.highlight ? "text-ai" : "text-ink")} style={{ letterSpacing: "-0.02em" }}>
                    {s.value}
                  </div>
                  <div className={cn("mt-1 text-[11px] font-mono", s.tone === "good" ? "text-good" : s.tone === "warn" ? "text-warn" : "text-ink-mute")}>
                    {s.delta}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 lg:px-6 pb-5 lg:pb-6 -mt-1 flex items-start gap-3 text-[13px] leading-relaxed">
              <span className="mt-1.5"><AIDot size={7} /></span>
              <p className="text-ink-dim flex-1">
                <span className="text-ai font-mono text-[10px] tracking-wider uppercase mr-2">AI brief</span>
                You&apos;re paying for <span className="text-ink">Canva twice</span> and <span className="text-ink">two overlapping AI tools</span>. Switching Adobe to Photography plan alone recovers <span className="text-ink">₹3,420/mo</span>. I drafted three one-tap actions.
              </p>
              <Link href="/insights"><Btn size="sm" kind="ai" icon="zap">Review 3 actions</Btn></Link>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-6 lg:px-8 pt-6 flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const on = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 h-8 rounded-full text-[12px] whitespace-nowrap transition tracking-tight",
                  on ? "bg-ink text-bg" : "text-ink-mute hairline hover:bg-bg-soft hover:text-ink"
                )}
              >
                {f}
                {f === "AI flagged" && (
                  <span className={cn("ml-1.5 font-mono text-[10px]", on ? "text-bg/60" : "text-ai")}>{flagged}</span>
                )}
              </button>
            );
          })}
          <div className="ml-auto text-[11px] font-mono text-ink-faint hidden md:block whitespace-nowrap">
            {list.length} of {subscriptions.length}
          </div>
        </div>

        {/* Feed */}
        <div className="px-6 lg:px-8 py-5 space-y-2">
          {list.map((s) => (
            <SubscriptionCard
              key={s.id} s={s}
              expanded={expanded === s.id}
              onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
            />
          ))}
          {list.length === 0 && (
            <div className="text-center py-12 text-ink-faint text-[13px]">No subscriptions match this filter.</div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <aside className="hidden xl:flex flex-col gap-5 p-6 border-l border-bg-edge sticky top-[97px] h-[calc(100vh-97px)] overflow-y-auto">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-[12px] font-medium tracking-tight text-ink">Upcoming renewals</h3>
            <span className="text-[10.5px] font-mono text-ink-faint">Next 14 days</span>
          </div>
          <div className="divide-y divide-bg-edge/60">
            {renewals.map((r, i) => <RenewalRow key={r.id} r={r} i={i} />)}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-[12px] font-medium tracking-tight text-ink">Savings opportunities</h3>
            <span className="text-[10.5px] font-mono text-ink-faint">{fmtINR(6748)}/mo</span>
          </div>
          <div className="space-y-2">
            {insights.slice(0, 3).map((ins) => <InsightMini key={ins.id} ins={ins} />)}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-[12px] font-medium tracking-tight text-ink">Alerts</h3>
            <span className="text-[10.5px] font-mono text-ink-faint">2 new</span>
          </div>
          <div className="space-y-1.5">
            {[
              { tone: "warn", icon: "clock", title: "Midjourney trial ends in 2 days", sub: "Auto-renews at ₹830/mo on May 25" },
              { tone: "warn", icon: "copy", title: "Canva billed in two workspaces", sub: "HDFC Teams plan covers it already" },
              { tone: "ai", icon: "trending-up", title: "Adobe price increased ₹420", sub: "From ₹4,299 last cycle" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-bg-soft cursor-default">
                <span className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                  a.tone === "warn" ? "text-warn bg-warn/10" : "text-ai bg-ai/10"
                )}>
                  <Icon name={a.icon} size={13} />
                </span>
                <div className="leading-tight">
                  <div className="text-[12px] text-ink">{a.title}</div>
                  <div className="text-[10.5px] text-ink-faint font-mono mt-0.5">{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AIAssistant />
      </aside>
    </div>
  );
}
