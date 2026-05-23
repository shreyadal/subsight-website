import { getBankConnections } from "@/lib/db/accounts";
import { ACCOUNTS } from "@/lib/mock-data";
import { Topbar } from "@/components/layout/Topbar";
import { Btn, Icon, ServiceMark, Pill, AIDot } from "@/components/primitives";
import type { Account } from "@/lib/mock-data";

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-soft p-2.5 hairline">
      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="text-[12.5px] text-ink mt-0.5 truncate">{value}</div>
    </div>
  );
}

function AccountCard({ a }: { a: Account }) {
  const reconnect = a.status === "reconnect";
  return (
    <div className="rounded-2xl bg-bg-card hairline p-5 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: a.color }} />
      <div className="pl-3">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <ServiceMark name={a.name.split(" ")[0]} size={40} />
            <div>
              <div className="text-[14px] text-ink flex items-center gap-2">
                {a.name}
                {reconnect ? (
                  <Pill tone="warn">Reconnect</Pill>
                ) : (
                  <Pill tone="good"><AIDot size={4} className="mr-0.5" />live</Pill>
                )}
              </div>
              <div className="font-mono text-[11px] text-ink-faint mt-0.5">{a.acct} · {a.kind}</div>
            </div>
          </div>
          <button className="text-ink-faint hover:text-ink"><Icon name="more-horizontal" size={16} /></button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <Mini label="Last sync" value={a.synced} />
          <Mini label="Subscriptions" value={String(a.subs)} />
          <Mini label="Sync mode" value="real-time" />
        </div>

        {reconnect ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] text-warn leading-snug">Consent expired. Reconnect to resume monitoring.</p>
            <Btn size="sm" kind="ai" icon="link">Reconnect</Btn>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Btn size="sm" kind="soft" icon="refresh-cw">Sync</Btn>
            <Btn size="sm" kind="soft" icon="eye">View transactions</Btn>
            <Btn size="sm" kind="ghost" icon="unplug">Disconnect</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function AccountsPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accounts = hasSupabase ? await getBankConnections() : ACCOUNTS;

  const gmail = { connected: true, email: "aanya@acme.in", lastSync: "4 min ago", subsDetected: 11, trialsDetected: 2 };

  return (
    <div className="flex-1 min-w-0">
      <Topbar
        title="Connected Accounts"
        subtitle={`${accounts.length} bank accounts · 1 Gmail · all read-only`}
        actions={
          <>
            <Btn size="sm" kind="soft" icon="refresh-cw">Sync now</Btn>
            <Btn size="sm" kind="ai" icon="plus">Add account</Btn>
          </>
        }
      />

      <div className="px-6 lg:px-8 py-6 space-y-7">
        {/* Bank accounts */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[16px] text-ink tracking-tight">Bank accounts</h2>
              <p className="text-[12px] text-ink-faint mt-0.5">Setu-powered Account Aggregator · RBI-licensed · read-only.</p>
            </div>
            <Btn size="sm" kind="soft" icon="plus">Connect another bank</Btn>
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            {accounts.map((a) => <AccountCard key={a.id} a={a} />)}
          </div>
        </section>

        {/* Gmail */}
        <section>
          <h2 className="text-[16px] text-ink tracking-tight mb-3">Gmail</h2>
          <div className="rounded-2xl bg-bg-card hairline p-5 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-bg-soft hairline flex items-center justify-center">
                <Icon name="mail" size={22} className="text-ai" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] text-ink">{gmail.email}</span>
                  <Pill tone="good"><AIDot size={4} className="mr-0.5" />live</Pill>
                </div>
                <div className="font-mono text-[11px] text-ink-faint">
                  last sync {gmail.lastSync} · {gmail.subsDetected} subscriptions from receipts · {gmail.trialsDetected} active trials
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Btn size="sm" kind="soft" icon="settings">Permissions</Btn>
              <Btn size="sm" kind="danger" icon="unplug">Disconnect</Btn>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-bg-soft hairline p-4 text-[12.5px] text-ink-dim leading-relaxed flex items-start gap-3">
            <Icon name="info" size={14} className="text-ink-faint mt-[2px]" />
            <p>Subsight reads only emails matching billing keywords (receipt, invoice, subscription, trial, renewal). We never read personal mail, never send mail, and you can revoke access at any time from your Google account.</p>
          </div>
        </section>

        {/* Uploads */}
        <section>
          <h2 className="text-[16px] text-ink tracking-tight mb-3">Statement uploads</h2>
          <div className="rounded-2xl bg-bg-card hairline overflow-hidden">
            {[
              { name: "HDFC_Statement_Apr.pdf", size: "1.4 MB", when: "Apr 30", extracted: 18 },
              { name: "ICICI_Statement_Apr.pdf", size: "982 KB", when: "Apr 28", extracted: 11 },
              { name: "Axis_CC_Apr.csv", size: "214 KB", when: "Apr 27", extracted: 9 },
            ].map((f, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-bg-edge last:border-0">
                <div className="w-9 h-9 rounded-lg bg-bg-soft hairline flex items-center justify-center">
                  <Icon name="file-text" size={16} className="text-ink-dim" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-ink truncate">{f.name}</div>
                  <div className="font-mono text-[10.5px] text-ink-faint">{f.size} · uploaded {f.when} · {f.extracted} subscriptions extracted</div>
                </div>
                <Pill tone="good">processed</Pill>
                <button className="text-ink-faint hover:text-ink"><Icon name="more-horizontal" size={16} /></button>
              </div>
            ))}
            <div className="px-4 py-4 bg-bg-soft">
              <Btn size="sm" kind="soft" icon="upload" className="w-full">Upload a new statement</Btn>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
