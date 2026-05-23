"use client";

import { useState, useTransition } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Btn, Icon, Placeholder, AIDot } from "@/components/primitives";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { signOut } from "@/lib/actions/auth";
import { deleteAccount } from "@/lib/actions/account";

const SECTIONS = ["Profile", "Notifications", "AI preferences", "Privacy & data", "Connected services", "Export", "Billing", "Sign out"];

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-bg-edge last:border-0">
      <div>
        <div className="text-[13.5px] text-ink">{label}</div>
        {sub && <div className="text-[11.5px] text-ink-faint font-mono mt-0.5">{sub}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={cn("relative w-10 h-6 rounded-full transition", on ? "bg-ai" : "bg-bg-edge")}
    >
      <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-bg shadow-sm transition-all", on ? "left-5" : "left-1")} />
    </button>
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState("Profile");
  const [, startTransition] = useTransition();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { user } = useAuth();

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const displayName = hasSupabase
    ? (user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Aanya Rao")
    : "Aanya Rao";
  const displayEmail = hasSupabase ? (user?.email ?? "aanya@acme.in") : "aanya@acme.in";

  return (
    <div className="flex-1 min-w-0">
      <Topbar
        title="Settings"
        subtitle="Account preferences and integrations"
      />

      <div className="px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-[200px_1fr] gap-6">
          {/* Section nav */}
          <nav className="flex lg:flex-col gap-1">
            {SECTIONS.map((s) => (
              s === "Sign out" ? (
                <button
                  key={s}
                  onClick={() => startTransition(() => signOut())}
                  className="px-3 h-9 rounded-lg text-[13px] text-left tracking-tight transition text-ink-mute hover:bg-bg-soft hover:text-ink mt-2 flex items-center gap-2"
                >
                  <Icon name="log-out" size={14} />
                  {s}
                </button>
              ) : (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={cn(
                    "px-3 h-9 rounded-lg text-[13px] text-left tracking-tight transition",
                    section === s ? "bg-bg-card text-ink hairline" : "text-ink-mute hover:bg-bg-soft hover:text-ink"
                  )}
                >
                  {s}
                </button>
              )
            ))}
          </nav>

          {/* Section content */}
          <div className="rounded-2xl bg-bg-card hairline p-6 min-h-[400px]">
            {section === "Profile" && (
              <div>
                <h2 className="text-[16px] text-ink tracking-tight mb-5">Profile</h2>
                <div className="flex items-center gap-4 mb-6">
                  <Placeholder label="avatar" ratio="1/1" className="w-16 !rounded-full" />
                  <div>
                    <div className="text-[16px] text-ink">{displayName}</div>
                    <div className="text-[12px] font-mono text-ink-faint">{displayEmail}</div>
                  </div>
                  <Btn size="sm" kind="soft">Change photo</Btn>
                </div>
                <div className="space-y-0">
                  <SettingRow label="Full name" sub="Used across Subsight">
                    <input defaultValue={displayName} className="h-9 px-3 rounded-lg bg-bg-soft hairline text-[13px] text-ink focus:hairline-ai outline-none w-48" />
                  </SettingRow>
                  <SettingRow label="Email" sub={`${displayEmail} · verified`}>
                    <Btn size="sm" kind="soft">Change email</Btn>
                  </SettingRow>
                  <SettingRow label="Password" sub="Last changed 3 months ago">
                    <Btn size="sm" kind="soft">Change password</Btn>
                  </SettingRow>
                  <SettingRow label="Currency" sub="Used for all amounts">
                    <div className="relative">
                      <select className="h-9 pl-3 pr-8 rounded-lg bg-bg-soft hairline text-[13px] text-ink focus:hairline-ai outline-none appearance-none">
                        <option>INR (₹)</option>
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                      </select>
                      <Icon name="chevron-down" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                    </div>
                  </SettingRow>
                </div>
                <div className="mt-5 flex gap-2">
                  <Btn kind="ai" size="md">Save changes</Btn>
                  <Btn kind="ghost" size="md">Cancel</Btn>
                </div>
              </div>
            )}

            {section === "Notifications" && (
              <div>
                <h2 className="text-[16px] text-ink tracking-tight mb-5">Notifications</h2>
                <div className="space-y-0">
                  <SettingRow label="Renewal reminders" sub="Get notified 3 days before renewals"><Toggle defaultOn={true} /></SettingRow>
                  <SettingRow label="Trial expiry alerts" sub="Alert when trials are about to convert"><Toggle defaultOn={true} /></SettingRow>
                  <SettingRow label="Price increase detection" sub="Notify when a charge increases vs last cycle"><Toggle defaultOn={true} /></SettingRow>
                  <SettingRow label="Duplicate subscription warning" sub="Alert when the same service is billed twice"><Toggle defaultOn={true} /></SettingRow>
                  <SettingRow label="AI weekly brief" sub="Get a weekly digest of your subscription health"><Toggle defaultOn={false} /></SettingRow>
                  <SettingRow label="Push notifications" sub="In-app and browser push"><Toggle defaultOn={true} /></SettingRow>
                  <SettingRow label="Email digest" sub="Daily or weekly email summary"><Toggle defaultOn={false} /></SettingRow>
                </div>
              </div>
            )}

            {section === "AI preferences" && (
              <div>
                <h2 className="text-[16px] text-ink tracking-tight mb-1">AI preferences</h2>
                <p className="text-[12.5px] text-ink-faint mb-5">Configure how Subsight&apos;s AI co-pilot behaves.</p>
                <div className="space-y-0">
                  <SettingRow label="Auto-sweep frequency" sub="How often AI scans for new patterns">
                    <div className="relative">
                      <select className="h-9 pl-3 pr-8 rounded-lg bg-bg-soft hairline text-[13px] text-ink focus:hairline-ai outline-none appearance-none">
                        <option>Real-time</option>
                        <option>Daily</option>
                        <option>Weekly</option>
                      </select>
                      <Icon name="chevron-down" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                    </div>
                  </SettingRow>
                  <SettingRow label="Autonomy level" sub="What AI can act on without asking you">
                    <div className="relative">
                      <select className="h-9 pl-3 pr-8 rounded-lg bg-bg-soft hairline text-[13px] text-ink focus:hairline-ai outline-none appearance-none">
                        <option>Draft only — I approve everything</option>
                        <option>Smart alerts — act on obvious ones</option>
                        <option>Autonomous — full autopilot</option>
                      </select>
                      <Icon name="chevron-down" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                    </div>
                  </SettingRow>
                  <SettingRow label="AI confidence threshold" sub="Minimum confidence to show a subscription"><Toggle defaultOn={true} /></SettingRow>
                  <SettingRow label="Cross-account intelligence" sub="AI can correlate patterns across all your accounts"><Toggle defaultOn={true} /></SettingRow>
                </div>
                <div className="mt-5 rounded-xl bg-ai/5 hairline-ai p-4 flex items-start gap-3">
                  <AIDot size={5} className="mt-[3px]" />
                  <p className="text-[12.5px] text-ink-dim leading-relaxed">
                    Higher autonomy means Subsight can pause trials or flag actions without confirmation. You can always override from the activity log.
                  </p>
                </div>
              </div>
            )}

            {section === "Privacy & data" && (
              <div>
                <h2 className="text-[16px] text-ink tracking-tight mb-1">Privacy & data</h2>
                <p className="text-[12.5px] text-ink-faint mb-5">Your data is encrypted, read-only, and always under your control.</p>
                <div className="space-y-0">
                  <SettingRow label="Data residency" sub="Where your data is stored"><span className="text-[13px] font-mono text-ink-mute">India (Mumbai)</span></SettingRow>
                  <SettingRow label="Data retention" sub="How long we keep processed data">
                    <div className="relative">
                      <select className="h-9 pl-3 pr-8 rounded-lg bg-bg-soft hairline text-[13px] text-ink focus:hairline-ai outline-none appearance-none">
                        <option>12 months</option>
                        <option>6 months</option>
                        <option>3 months</option>
                      </select>
                      <Icon name="chevron-down" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                    </div>
                  </SettingRow>
                  <SettingRow label="DPDP consent" sub="Data Protection and Privacy Provisions Act consent">
                    <Btn size="sm" kind="soft">Review consent</Btn>
                  </SettingRow>
                  <SettingRow label="Analytics data" sub="Help improve Subsight with anonymized usage"><Toggle defaultOn={true} /></SettingRow>
                </div>
                <div className="mt-5 space-y-2">
                  <Btn kind="soft" size="md" icon="download" className="w-full justify-start">Download all my data</Btn>
                  <Btn kind="danger" size="md" icon="trash-2" className="w-full justify-start" onClick={() => setDeleteConfirmOpen(true)}>Delete account and all data</Btn>
                </div>
              </div>
            )}

            {section === "Connected services" && (
              <div>
                <h2 className="text-[16px] text-ink tracking-tight mb-5">Connected services</h2>
                <div className="space-y-3">
                  {[
                    { name: "HDFC Bank", desc: "Savings · Primary", status: "Connected", icon: "landmark" },
                    { name: "ICICI Bank", desc: "Savings", status: "Connected", icon: "landmark" },
                    { name: "Axis Bank", desc: "Credit Card", status: "Connected", icon: "landmark" },
                    { name: "Gmail", desc: "aanya@acme.in", status: "Connected", icon: "mail" },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl bg-bg-soft hairline">
                      <div className="w-9 h-9 rounded-lg bg-bg-card hairline flex items-center justify-center">
                        <Icon name={s.icon} size={16} className="text-ink-dim" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] text-ink">{s.name}</div>
                        <div className="text-[11px] font-mono text-ink-faint">{s.desc}</div>
                      </div>
                      <span className="text-[11px] font-mono text-good">{s.status}</span>
                      <Btn size="sm" kind="ghost" icon="unplug">Disconnect</Btn>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "Export" && (
              <div>
                <h2 className="text-[16px] text-ink tracking-tight mb-1">Export data</h2>
                <p className="text-[12.5px] text-ink-faint mb-5">Download your subscription and transaction data in various formats.</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { title: "Subscriptions CSV", desc: "All detected subscriptions with metadata", icon: "table" },
                    { title: "Transactions CSV", desc: "Raw transaction log with recurring scores", icon: "arrow-left-right" },
                    { title: "Insights report PDF", desc: "AI-generated savings opportunity report", icon: "sparkles" },
                    { title: "Full data archive", desc: "Everything in a single ZIP file", icon: "archive" },
                  ].map((e) => (
                    <div key={e.title} className="rounded-xl bg-bg-soft hairline p-4 flex items-start gap-3">
                      <Icon name={e.icon} size={18} className="text-ai mt-0.5" />
                      <div className="flex-1">
                        <div className="text-[13.5px] text-ink">{e.title}</div>
                        <div className="text-[11.5px] text-ink-faint mt-0.5">{e.desc}</div>
                      </div>
                      <Btn size="sm" kind="soft" icon="download">Export</Btn>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section === "Billing" && (
              <div>
                <h2 className="text-[16px] text-ink tracking-tight mb-5">Subsight billing</h2>
                <div className="rounded-xl bg-ai/5 hairline-ai p-5 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[16px] text-ink">Pro plan</div>
                      <div className="text-[12px] font-mono text-ink-faint">Next billing: Jun 1, 2026</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[22px] text-ai tabular-nums">₹299<span className="text-[13px] text-ink-faint font-mono">/mo</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Btn size="sm" kind="soft">Change plan</Btn>
                    <Btn size="sm" kind="ghost">Cancel subscription</Btn>
                  </div>
                </div>
                <div className="rounded-xl bg-bg-card hairline divide-y divide-bg-edge">
                  {["Jun 1, 2026 · ₹299", "May 1, 2026 · ₹299", "Apr 1, 2026 · ₹299"].map((inv, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[13px] text-ink font-mono">{inv}</span>
                      <Btn size="sm" kind="ghost" icon="download">Invoice</Btn>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete account confirmation modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-2xl bg-bg-card hairline p-6 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center mb-4">
              <Icon name="trash-2" size={18} className="text-danger" />
            </div>
            <h2 className="text-[17px] text-ink tracking-tight mb-1">Delete your account?</h2>
            <p className="text-[13px] text-ink-dim leading-relaxed mb-1">
              This permanently removes your account and all associated data — subscriptions, transactions, AI insights, bank connections, and uploaded statements.
            </p>
            <p className="text-[13px] text-danger font-mono mb-5">This action cannot be undone.</p>

            {deleteError && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-danger/10 text-[12.5px] text-danger font-mono">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2">
              <Btn
                kind="danger"
                size="md"
                icon="trash-2"
                className="flex-1"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteError(null);
                  startDeleteTransition(async () => {
                    const result = await deleteAccount();
                    if (result?.error) setDeleteError(result.error);
                  });
                }}
              >
                {isDeleting ? "Deleting…" : "Yes, delete everything"}
              </Btn>
              <Btn
                kind="soft"
                size="md"
                className="flex-1"
                disabled={isDeleting}
                onClick={() => { setDeleteConfirmOpen(false); setDeleteError(null); }}
              >
                Cancel
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
