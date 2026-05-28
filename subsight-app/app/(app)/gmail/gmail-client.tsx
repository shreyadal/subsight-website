"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Btn, Icon, ServiceMark, Pill } from "@/components/primitives";
import { Topbar } from "@/components/layout/Topbar";
import { AIDot } from "@/components/primitives";
import { cn } from "@/lib/utils";

interface EmailMatch {
  fromAddress: string;
  subject: string;
  merchantName: string;
  amountInr: number | null;
  tag: string;
  emailDate: string;
  confidence: number | null;
  detectedBy: string | null;
}

interface ConnectionStats {
  gmailEmail: string;
  emailsScanned: number;
  subscriptionsFound: number;
  trialsDetected: number;
  lastSyncedAt: string;
  isConnected: boolean;
  isSyncing: boolean;
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
  return new Date(iso).toLocaleString("en-IN", { month: "short", day: "numeric" });
}

function tagTone(tag: string): "warn" | "ai" | "neutral" {
  if (tag === "trial") return "warn";
  return "ai";
}

function tagLabel(tag: string): string {
  return (
    { subscription: "Subscription", invoice: "Invoice", trial: "Trial alert", renewal: "Renewal" }[
      tag
    ] ?? tag
  );
}

const DETECTED_BY_LABELS: Record<string, string> = {
  domain:    "L1 · domain",
  processor: "L2 · processor",
  keyword:   "L3 · keyword",
  ai:        "L4 · AI",
  heuristic: "L5 · heuristic",
};

const DETECTED_BY_TONES: Record<string, string> = {
  domain:    "text-good",
  processor: "text-ai",
  keyword:   "text-ink",
  ai:        "text-warn",
  heuristic: "text-ink-faint",
};

export function GmailPageClient({ stats, matches }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [syncError, setSyncError]   = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    emailsScanned: number;
    subscriptionsFound: number;
    aiCallsMade: number;
  } | null>(null);
  const [isSyncing, startSync]           = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      setJustConnected(true);
      // Remove the query param from URL without re-render
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    }
    if (searchParams.get("error")) {
      setSyncError(`OAuth error: ${searchParams.get("error")}. Please try connecting again.`);
    }
  }, [searchParams]);

  function handleSync() {
    setSyncError(null);
    setSyncResult(null);
    startSync(async () => {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSyncError(data.error ?? "Sync failed");
      } else {
        setSyncResult({
          emailsScanned: data.emailsScanned ?? 0,
          subscriptionsFound: data.subscriptionsFound ?? 0,
          aiCallsMade: data.aiCallsMade ?? 0,
        });
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

  const isActive = stats.isConnected && !isSyncing;
  const syncingLabel = stats.isSyncing
    ? "Sync in progress…"
    : isSyncing
    ? "Syncing…"
    : "Sync now";

  const statItems = [
    {
      label: "Emails scanned",
      value: stats.emailsScanned.toLocaleString("en-IN"),
      sub: "billing keywords only",
    },
    {
      label: "Subscriptions found",
      value: String(stats.subscriptionsFound),
      sub: "from receipts & invoices",
    },
    {
      label: "Trials detected",
      value: String(stats.trialsDetected),
      sub:
        stats.trialsDetected > 0
          ? `${stats.trialsDetected} may convert soon`
          : "none active",
      tone: stats.trialsDetected > 0 ? "warn" : undefined,
    },
    {
      label: "Last sync",
      value: fmtRelative(stats.lastSyncedAt),
      sub: "on demand",
    },
  ];

  return (
    <div className="flex-1 min-w-0">
      <Topbar
        title="Gmail Sync"
        subtitle={`${stats.gmailEmail || "not connected"} · ${
          stats.isSyncing
            ? "syncing…"
            : stats.isConnected
            ? "live"
            : "disconnected"
        } · billing keywords only`}
        actions={
          <>
            <button
              onClick={() => setDebugMode((d) => !d)}
              className={cn(
                "h-8 px-3 rounded-lg text-[11.5px] font-mono transition hairline",
                debugMode
                  ? "bg-warn/10 text-warn hairline-warn"
                  : "text-ink-faint hover:text-ink bg-bg-soft"
              )}
            >
              {debugMode ? "debug ON" : "debug"}
            </button>
            <Btn
              size="sm"
              kind="soft"
              icon={isSyncing || stats.isSyncing ? "loader-2" : "refresh-cw"}
              onClick={handleSync}
              disabled={isSyncing || stats.isSyncing || !stats.isConnected}
            >
              {syncingLabel}
            </Btn>
            <Btn
              size="sm"
              kind="danger"
              icon="unplug"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Disconnecting…" : "Disconnect"}
            </Btn>
          </>
        }
      />

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Error banner */}
        {syncError && (
          <div className="rounded-xl bg-danger/10 hairline px-4 py-3 flex items-center gap-2 text-[13px] text-danger">
            <Icon name="alert-circle" size={14} />
            {syncError}
            <button onClick={() => setSyncError(null)} className="ml-auto text-danger/60 hover:text-danger">
              <Icon name="x" size={13} />
            </button>
          </div>
        )}

        {/* Just-connected banner */}
        {justConnected && (
          <div className="rounded-xl bg-good/10 hairline px-4 py-3 flex items-center gap-2.5 text-[12.5px] text-good">
            <Icon name="check-circle" size={14} />
            <span>Gmail connected successfully! Click <strong>Sync now</strong> to scan your inbox.</span>
            <button onClick={() => setJustConnected(false)} className="ml-auto text-good/60 hover:text-good">
              <Icon name="x" size={13} />
            </button>
          </div>
        )}

        {/* Not connected — connect card */}
        {!stats.isConnected && (
          <div className="rounded-2xl bg-bg-card hairline-strong p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(600px at 50% 0%, oklch(0.88 0.18 125 / 0.08), transparent)" }}
            />
            <div className="flex items-start gap-4 mb-6 relative">
              <div className="w-14 h-14 rounded-2xl bg-ai/10 hairline-ai flex items-center justify-center shrink-0">
                <Icon name="mail" size={26} className="text-ai" />
              </div>
              <div>
                <h2 className="text-[20px] text-ink tracking-tight mb-1">Connect Gmail</h2>
                <p className="text-[13.5px] text-ink-mute leading-relaxed max-w-[500px]">
                  Subsight scans only emails matching billing keywords — receipts, invoices, subscription confirmations, trial alerts.
                  Never personal mail. Read-only access.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6 text-center max-w-[480px]">
              {[
                { icon: "eye", label: "Read only", sub: "Billing emails only" },
                { icon: "filter", label: "Keyword filtered", sub: "Not personal mail" },
                { icon: "undo-2", label: "Revocable", sub: "One-click in Google" },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-bg-soft hairline p-3">
                  <Icon name={f.icon} size={16} className="text-ai mx-auto mb-1.5" />
                  <div className="text-[12px] text-ink">{f.label}</div>
                  <div className="text-[10px] text-ink-faint font-mono mt-0.5">{f.sub}</div>
                </div>
              ))}
            </div>
            <a
              href="/api/auth/gmail/connect"
              className="inline-flex items-center justify-center gap-3 h-12 px-6 rounded-xl bg-bg-card hairline-strong hover:bg-bg-edge transition text-[13.5px] text-ink font-medium"
            >
              <span className="w-5 h-5 rounded-[5px] bg-ink flex items-center justify-center text-bg font-medium text-[12px]">G</span>
              Connect Gmail with Google
            </a>
          </div>
        )}

        {/* Sync result banner */}
        {syncResult && (
          <div className="rounded-xl bg-good/10 hairline px-4 py-3 flex items-center gap-2.5 text-[12.5px] text-good">
            <Icon name="check-circle" size={14} />
            <span>
              Sync complete — scanned <strong>{syncResult.emailsScanned}</strong> emails,
              found <strong>{syncResult.subscriptionsFound}</strong> subscriptions
              {syncResult.aiCallsMade > 0 && `, ${syncResult.aiCallsMade} AI inferences`}.
            </span>
          </div>
        )}

        {/* Status card */}
        <div className="rounded-2xl bg-bg-card hairline-ai relative overflow-hidden ai-scan">
          <div className="p-6 grid md:grid-cols-4 gap-6">
            {statItems.map((s) => (
              <div key={s.label}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-ink-faint mb-1">
                  {s.label}
                </div>
                <div
                  className={`text-[22px] tabular-nums tracking-tight ${
                    s.tone === "warn" ? "text-warn" : "text-ink"
                  }`}
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
            <span className="text-ink font-mono">
              receipt, invoice, subscription, trial, renewal, billing, payment
            </span>
            . We never read personal emails, never send on your behalf, and access can be revoked
            instantly from your Google account security settings.
          </p>
        </div>

        {/* Debug legend */}
        {debugMode && (
          <div className="rounded-xl bg-warn/5 hairline-warn p-4 space-y-2">
            <div className="text-[10.5px] font-mono text-warn uppercase tracking-wider mb-3">
              Debug mode — detection layers
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] font-mono">
              {Object.entries(DETECTED_BY_LABELS).map(([key, label]) => (
                <span key={key} className={cn("flex items-center gap-1.5", DETECTED_BY_TONES[key])}>
                  <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Matched emails */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[16px] text-ink tracking-tight">
              Recent billing email matches
            </h2>
            <span className="text-[11.5px] font-mono text-ink-faint">
              {matches.length} detected
            </span>
          </div>

          {matches.length === 0 ? (
            <div className="rounded-2xl bg-bg-card hairline p-10 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-3 text-ink-faint">
                <AIDot size={5} />
                <span className="text-[11px] font-mono uppercase tracking-wider">
                  {isActive
                    ? "No billing emails matched yet"
                    : "Gmail not connected"}
                </span>
              </div>
              <p className="text-[13px] text-ink-dim">
                {isActive
                  ? `Click "Sync now" to scan your inbox for billing and subscription emails.`
                  : "Connect your Gmail account from the onboarding screen."}
              </p>
            </div>
          ) : debugMode ? (
            /* ── Debug table ── */
            <div className="rounded-2xl bg-bg-card hairline overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="border-b border-bg-edge bg-bg-soft">
                      <th className="text-left px-4 py-2.5 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Merchant</th>
                      <th className="text-left px-4 py-2.5 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Raw sender</th>
                      <th className="text-left px-4 py-2.5 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Subject</th>
                      <th className="text-left px-4 py-2.5 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Amount</th>
                      <th className="text-left px-4 py-2.5 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Tag</th>
                      <th className="text-left px-4 py-2.5 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Layer</th>
                      <th className="text-left px-4 py-2.5 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Conf.</th>
                      <th className="text-left px-4 py-2.5 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-edge">
                    {matches.map((m, i) => (
                      <tr key={i} className="hover:bg-bg-soft/50 transition">
                        <td className="px-4 py-2.5 font-medium text-ink whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ServiceMark name={m.merchantName} size={22} />
                            {m.merchantName}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-ink-dim max-w-[180px] truncate" title={m.fromAddress}>
                          {m.fromAddress}
                        </td>
                        <td className="px-4 py-2.5 text-ink-dim max-w-[220px] truncate" title={m.subject}>
                          {m.subject}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-ink whitespace-nowrap">
                          {m.amountInr != null ? `₹${m.amountInr.toLocaleString("en-IN")}` : <span className="text-ink-faint">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <Pill tone={tagTone(m.tag)}>{tagLabel(m.tag)}</Pill>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={cn("font-mono text-[10px]", DETECTED_BY_TONES[m.detectedBy ?? ""] ?? "text-ink-faint")}>
                            {DETECTED_BY_LABELS[m.detectedBy ?? ""] ?? m.detectedBy ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                          {m.confidence != null ? (
                            <span className={m.confidence >= 0.9 ? "text-good" : m.confidence >= 0.7 ? "text-ai" : "text-warn"}>
                              {(m.confidence * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-ink-faint whitespace-nowrap">
                          {fmtDate(m.emailDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── Normal list ── */
            <div className="rounded-2xl bg-bg-card hairline overflow-hidden divide-y divide-bg-edge">
              {matches.map((m, i) => (
                <div
                  key={i}
                  className="px-4 py-3.5 flex items-center gap-3 hover:bg-bg-soft transition"
                >
                  <ServiceMark name={m.merchantName} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-ink-dim font-mono truncate">
                      {m.fromAddress}
                    </div>
                    <div className="text-[13px] text-ink truncate">{m.subject}</div>
                  </div>
                  <Pill tone={tagTone(m.tag)}>{tagLabel(m.tag)}</Pill>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] text-ink tabular-nums font-mono">
                      {m.amountInr
                        ? `₹${m.amountInr.toLocaleString("en-IN")}`
                        : "—"}
                    </div>
                    <div className="text-[10px] font-mono text-ink-faint">
                      {fmtDate(m.emailDate)}
                    </div>
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
