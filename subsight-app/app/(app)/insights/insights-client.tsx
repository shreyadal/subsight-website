"use client";

import { useState, useTransition } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Btn, Icon, ServiceMark, Pill } from "@/components/primitives";
import { fmtINR, cn } from "@/lib/utils";
import { acceptInsight, dismissInsight } from "@/lib/actions/insights";
import type { Insight, Subscription } from "@/lib/mock-data";

const KIND_TONE: Record<string, "good" | "warn" | "ai" | "neutral"> = {
  savings: "good", yearly: "good", duplicate: "warn", overlap: "warn", underused: "neutral", trial: "warn",
};
const KIND_LABEL: Record<string, string> = {
  savings: "Switch plan", yearly: "Switch to yearly", duplicate: "Duplicate billing",
  overlap: "Overlapping tools", underused: "Underused", trial: "Trial converting",
};
const KIND_ICON: Record<string, string> = {
  savings: "trending-down", yearly: "calendar", duplicate: "copy",
  overlap: "git-branch", underused: "clock", trial: "alarm-clock",
};

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const c = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "ai" ? "text-ai" : "text-ink";
  return (
    <div className="rounded-xl bg-bg-soft hairline p-4">
      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-faint mb-2">{label}</div>
      <div className={cn("text-[22px] tabular-nums tracking-tight", c)} style={{ letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

interface Props {
  insights: Insight[];
  subscriptions: Subscription[];
}

export function InsightsClient({ insights, subscriptions }: Props) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  const total = insights.reduce((a, i) => a + (i.period === "mo" ? i.amount : i.amount / 12), 0);

  function handleAccept(id: string) {
    setAccepted((a) => ({ ...a, [id]: true }));
    startTransition(async () => { await acceptInsight(id); });
  }

  function handleDismiss(id: string) {
    setDismissed((d) => ({ ...d, [id]: true }));
    startTransition(async () => { await dismissInsight(id); });
  }

  return (
    <div className="flex-1 min-w-0">
      <Topbar
        title="Insights"
        subtitle={`AI co-pilot · ${insights.length} actions drafted today`}
        actions={
          <>
            <Btn size="sm" kind="soft" icon="filter">Filter</Btn>
            <Btn size="sm" kind="ai" icon="zap">Accept all safe</Btn>
          </>
        }
      />

      {/* Headline savings */}
      <div className="px-6 lg:px-8 pt-6">
        <div className="rounded-2xl bg-bg-card hairline-ai overflow-hidden relative ai-scan">
          <div className="p-6 lg:p-8 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-ai mb-3">{"// Subsight AI · headline savings"}</div>
              <div className="text-[44px] lg:text-[56px] tabular-nums tracking-tight text-ai leading-none" style={{ letterSpacing: "-0.03em" }}>
                {fmtINR(Math.round(total))}<span className="text-[18px] text-ink-mute font-mono ml-2">/mo</span>
              </div>
              <p className="mt-3 text-[14px] text-ink-dim max-w-[460px] leading-relaxed">
                Recoverable across {insights.length} drafted actions. Accept the three safe ones with no usage impact and net{" "}
                <span className="text-ink">₹4,749/mo</span> immediately.
              </p>
              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <Btn kind="ai" size="md" icon="check">Accept 3 safe actions</Btn>
                <Btn kind="soft" size="md" icon="message-square">Ask Subsight to explain</Btn>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Yearly impact" value={fmtINR(Math.round(total * 12))} tone="ai" />
              <MiniStat label="Drafted actions" value={String(insights.length)} />
              <MiniStat label="One-tap safe" value="3" tone="good" />
              <MiniStat label="Needs review" value="3" tone="warn" />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation cards */}
      <div className="px-6 lg:px-8 pt-7 pb-10">
        <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint mb-3">
          Drafted actions · most impact first
        </div>
        <div className="grid lg:grid-cols-2 gap-3">
          {insights.map((ins) => {
            if (dismissed[ins.id]) return null;
            const isAccepted = accepted[ins.id];
            return (
              <div key={ins.id} className={cn("rounded-2xl bg-bg-card hairline overflow-hidden", isAccepted && "opacity-60")}>
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-ai/10 hairline-ai flex items-center justify-center shrink-0">
                      <Icon name={KIND_ICON[ins.kind] || "sparkles"} size={18} className="text-ai" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill tone={KIND_TONE[ins.kind] || "neutral"}>{KIND_LABEL[ins.kind]}</Pill>
                        <span className="font-mono text-[10.5px] text-ink-faint">{ins.services.join(" · ")}</span>
                      </div>
                      <h3 className="text-[16px] text-ink tracking-tight leading-snug">{ins.title}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[20px] text-ai tabular-nums tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                        −{fmtINR(ins.amount)}
                      </div>
                      <div className="text-[10.5px] font-mono text-ink-faint">per {ins.period}</div>
                    </div>
                  </div>

                  <p className="text-[13px] text-ink-dim leading-relaxed mb-4">
                    <span className="text-ai font-mono text-[10px] uppercase tracking-wider mr-2">AI</span>
                    {ins.body}
                  </p>

                  <div className="flex items-center gap-2 mb-5">
                    {ins.services.map((sv, i) => <ServiceMark key={i} name={sv} size={28} />)}
                  </div>

                  {!isAccepted ? (
                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-bg-edge">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-ink-faint">
                        <Icon name="shield-check" size={12} />
                        {ins.kind === "trial" || ins.kind === "duplicate" || ins.kind === "yearly"
                          ? "no usage impact"
                          : "review usage first"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Btn size="sm" kind="ghost" onClick={() => handleDismiss(ins.id)}>Dismiss</Btn>
                        <Btn size="sm" kind="ai" icon="zap" onClick={() => handleAccept(ins.id)}>
                          {ins.action}
                        </Btn>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-bg-edge flex items-center gap-2 text-[12px] text-good">
                      <Icon name="check-check" size={14} /> Accepted · Subsight will action this on next renewal.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Watched but fine */}
        <div className="mt-10">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint mb-3">
            Watched but currently fine
          </div>
          <div className="rounded-xl bg-bg-card hairline divide-y divide-bg-edge">
            {subscriptions.filter((s) => !s.tag).slice(0, 4).map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                <ServiceMark name={s.name} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-ink">{s.name}</div>
                  <div className="text-[10.5px] font-mono text-ink-faint">stable · {s.cat.toLowerCase()}</div>
                </div>
                <span className="text-[11px] font-mono text-good">no action needed</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
