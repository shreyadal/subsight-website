"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Btn, Icon, ServiceMark, Pill } from "@/components/primitives";
import { Topbar } from "@/components/layout/Topbar";
import { AIDot } from "@/components/primitives";

interface EmailMatch {
  fromAddress: string;
  subject: string;
  merchantName: string;
  amountInr: number | null;
  tag: string;
  emailDate: string;
}

interface ConnectionStats {
  gmailEmail: string;
  emailsScanned: number;
  subscriptionsFound: number;
  trialsDetected: number;
  lastSyncedAt: string;
  isConnected: boolean;
}

interface Props {
  stats: ConnectionStats;
  matches: EmailMatch[];
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { month: "short", day: "numeric" });
}

function tagTone(tag: string): "warn" | "ai" | "neutral" {
  if (tag === "trial") return "warn";
  return "ai";
}

function tagLabel(tag: string): string {
  return { subscription: "Subscription", invoice: "Invoice", trial: "Trial alert", renewal: "Renewal" }[tag] ?? tag;
}

export function GmailPageClient({ stats, matches }: Props) {
  const router = useRouter();
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, startSync] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();

  function handleSync() {
    setSyncError(null);
    startSync(async () => {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncError(data.error ?? "Sync failed");
      } else {
        router.refresh();
      }
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      await fetch("/api/gmail/disconnect", { method: "POST" });
      router.refresh();
    });
  }

  const statItems = [
    { label: "Emails scanned", value: stats.emailsScanned.toLocaleString("en-IN"), sub: "billing keywords only" },
    { label: "Subscriptions found", value: String(stats.subscriptionsFound), sub: "from receipts & invoices" },
    {
      label: "Trials detected",
      value: String(stats.trialsDetected),
      sub: stats.trialsDetected > 0 ? `${stats.trialsDetected} may convert soon` : "none active",
      tone: stats.trialsDetected > 0 ? "warn" : undefined,
    },
    { label: "Last sync", value: fmtRelative(stats.lastSyncedAt), sub: "on demand or auto" },
  ];

  return (
    <div className="flex-1 min-w-0">
      <Topbar
        title="Gmail Sync"
        subtitle={`${stats.gmailEmail} · ${stats.isConnected ? "live" : "disconnected"} · billing keywords only`}
        actions={
          <>
            <Btn size="sm" kind="soft" icon="refresh-cw" onClick={handleSync} disabled={isSyncing || !stats.isConnected}>
              {isSyncing ? "Syncing…" : "Sync now"}
            </Btn>
            <Btn size="sm" kind="danger" icon="unplug" onClick={handleDisconnect} disabled={isDisconnecting}>
              {isDisconnecting ? "Disconnecting…" : "Disconnect Gmail"}
            </Btn>
          </>
        }
      />

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {syncError && (
          <div className="rounded-xl bg-danger/10 hairline px-4 py-3 flex items-center gap-2 text-[13px] text-danger">
            <Icon name="alert-circle" size={14} />
            {syncError}
          </div>
        )}

        {/* Status card */}
        <div className="rounded-2xl bg-bg-card hairline-ai relative overflow-hidden ai-scan">
          <div className="p-6 grid md:grid-cols-4 gap-6">
            {statItems.map((s) => (
              <div key={s.label}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-faint mb-1">{s.label}</div>
                <div
                  className={`text-[22px] tabular-nums tracking-tight ${s.tone === "warn" ? "text-warn" : "text-ink"}`}
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {s.value}
                </div>
                <div className="text-[10.5px] font-mono text-ink-faint mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions info */}
        <div className="rounded-xl bg-bg-soft hairline p-4 flex items-start gap-3 text-[12.5px] text-ink-dim leading-relaxed">
          <Icon name="shield-check" size={14} className="text-ai mt-[2px]" />
          <p>
            Subsight only reads emails matching billing keywords:{" "}
            <span className="text-ink font-mono">receipt, invoice, subscription, trial, renewal, billing</span>.
            We never read personal emails, never send on your behalf, and access can be revoked instantly from your Google account security settings.
          </p>
        </div>

        {/* Matched emails */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[16px] text-ink tracking-tight">Recent billing email matches</h2>
            <span className="text-[11.5px] font-mono text-ink-faint">{matches.length} detected</span>
          </div>

          {matches.length === 0 ? (
            <div className="rounded-2xl bg-bg-card hairline p-10 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-3 text-ink-faint">
                <AIDot size={5} />
                <span className="text-[11px] font-mono uppercase tracking-wider">
                  {stats.isConnected ? "No billing emails found yet" : "Gmail not connected"}
                </span>
              </div>
              <p className="text-[13px] text-ink-dim">
                {stats.isConnected
                  ? "Click “Sync now” to scan your inbox for billing and subscription emails."
                  : "Connect your Gmail account from the onboarding screen to enable email scanning."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-bg-card hairline overflow-hidden divide-y divide-bg-edge">
              {matches.map((m, i) => (
                <div key={i} className="px-4 py-3.5 flex items-center gap-3 hover:bg-bg-soft transition">
                  <ServiceMark name={m.merchantName} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-ink-dim font-mono truncate">{m.fromAddress}</div>
                    <div className="text-[13px] text-ink truncate">{m.subject}</div>
                  </div>
                  <Pill tone={tagTone(m.tag)}>{tagLabel(m.tag)}</Pill>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] text-ink tabular-nums font-mono">
                      {m.amountInr ? `₹${m.amountInr.toLocaleString("en-IN")}` : "—"}
                    </div>
                    <div className="text-[10px] font-mono text-ink-faint">{fmtDate(m.emailDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
