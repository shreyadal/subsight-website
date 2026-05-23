"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Btn, Icon, ServiceMark, Pill } from "@/components/primitives";
import { fmtINR } from "@/lib/utils";
import type { Transaction } from "@/lib/mock-data";

function RecurringBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "oklch(0.88 0.18 125)" : pct >= 50 ? "oklch(0.80 0.14 75)" : "oklch(0.46 0.01 80)";
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 rounded-full bg-bg-edge overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-ink-faint">{pct}%</span>
    </div>
  );
}

interface Props {
  transactions: Transaction[];
}

export function TransactionsClient({ transactions }: Props) {
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) =>
    !search || t.norm.toLowerCase().includes(search.toLowerCase()) || t.merchant.toLowerCase().includes(search.toLowerCase())
  );

  const today = filtered.slice(0, 2);
  const yesterday = filtered.slice(2, 5);
  const thisWeek = filtered.slice(5);

  function Group({ label, items }: { label: string; items: Transaction[] }) {
    if (!items.length) return null;
    return (
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-faint mb-2 pt-4">{label}</div>
        <div className="rounded-xl bg-bg-card hairline overflow-hidden divide-y divide-bg-edge">
          {items.map((t) => (
            <div key={t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-bg-soft transition">
              <ServiceMark name={t.norm} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] text-ink">{t.norm}</span>
                  {t.recurring >= 0.85 && <Pill tone="ai">Recurring</Pill>}
                  {t.recurring < 0.3 && <Pill tone="neutral">One-time</Pill>}
                </div>
                <div className="text-[10.5px] font-mono text-ink-faint">
                  {t.merchant} · {t.acct} · {t.cat}
                </div>
              </div>
              <RecurringBar value={t.recurring} />
              <div className="text-right">
                <div className="text-[13px] text-ink tabular-nums font-mono">{fmtINR(t.amt)}</div>
                <div className="text-[10px] font-mono text-ink-faint">{t.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <Topbar
        title="Transactions"
        subtitle="Recurring intelligence · 4 accounts"
        actions={
          <>
            <Btn size="sm" kind="soft" icon="download">Export</Btn>
            <Btn size="sm" kind="ai" icon="sparkles">AI sweep</Btn>
          </>
        }
      />

      <div className="px-6 lg:px-8 py-6">
        {/* Search + filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-[400px]">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-bg-card hairline focus:hairline-ai outline-none text-[13px] placeholder:text-ink-faint"
            />
          </div>
          <Btn size="sm" kind="soft" icon="filter">Filter</Btn>
          <div className="ml-auto text-[11px] font-mono text-ink-faint hidden md:block">
            {filtered.length} transactions
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-[11px] font-mono text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ai" /> recurring confidence
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warn" /> moderate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-bg-edge" /> one-time
          </span>
        </div>

        <Group label="Today" items={today} />
        <Group label="Yesterday" items={yesterday} />
        <Group label="This week" items={thisWeek} />

        {filtered.length === 0 && (
          <div className="text-center py-16 text-ink-faint text-[13px]">No transactions match your search.</div>
        )}
      </div>
    </div>
  );
}
