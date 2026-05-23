"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateOnboardingState } from "@/lib/actions/auth";
import { Logo, Btn, Icon, AIDot, ServiceMark, Pill } from "@/components/primitives";
import { ACCOUNTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ─── Shell ────────────────────────────────────────────────────────────────────
function OnboardingShell({
  step, children, onSkip, gmailAuto = false,
}: {
  step: number;
  children: React.ReactNode;
  onSkip?: () => void;
  gmailAuto?: boolean;
}) {
  const steps = [
    { id: 1, label: "Connect" },
    { id: 2, label: gmailAuto ? "Gmail · auto ✓" : "Gmail" },
    { id: 3, label: "AI analysis" },
  ];
  const isDone = (sid: number) => step > sid || (sid === 2 && gmailAuto);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "radial-gradient(900px 500px at 50% -10%, oklch(0.88 0.18 125 / 0.06), transparent 60%), oklch(0.13 0.008 70)" }}
    >
      <header className="px-6 lg:px-10 h-16 flex items-center justify-between border-b border-bg-edge">
        <Logo size={22} />
        <div className="hidden md:flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div className={cn(
                "flex items-center gap-2 px-3 h-8 rounded-full text-[11.5px] font-mono",
                step === s.id ? "bg-ai/10 text-ai hairline-ai" : isDone(s.id) ? "text-good" : "text-ink-faint"
              )}>
                <span className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                  step === s.id ? "bg-ai text-bg" : isDone(s.id) ? "bg-good text-bg" : "bg-bg-edge text-ink-faint"
                )}>
                  {isDone(s.id) ? "✓" : s.id}
                </span>
                {s.label}
              </div>
              {i < steps.length - 1 && <div className="w-6 h-px bg-bg-edge" />}
            </div>
          ))}
        </div>
        <button onClick={() => window.location.href = "/"} className="text-[12.5px] text-ink-faint hover:text-ink inline-flex items-center gap-1.5">
          <Icon name="x" size={14} /> exit setup
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 lg:px-10 py-10">
        <div className="w-full max-w-[1080px]">{children}</div>
      </main>

      {onSkip && (
        <footer className="px-6 lg:px-10 h-14 border-t border-bg-edge flex items-center justify-end">
          <button onClick={onSkip} className="text-[12px] text-ink-faint hover:text-ink font-mono">
            skip for now →
          </button>
        </footer>
      )}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({ onNext, gmailAuto }: { onNext: (source: string) => void; gmailAuto: boolean }) {
  const [hover, setHover] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  return (
    <OnboardingShell step={1} gmailAuto={gmailAuto}>
      <div className="text-center mb-10">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ai mb-3">{"// Step 1 of 3"}</div>
        <h1 className="text-[36px] lg:text-[44px] tracking-tight text-ink" style={{ letterSpacing: "-0.03em" }}>
          Where should we look <span className="font-serif italic text-ai">first?</span>
        </h1>
        <p className="mt-4 text-[15px] text-ink-mute max-w-[560px] mx-auto leading-relaxed">
          Subsight needs a starting point. Connect a bank for live monitoring, or drop a statement for a one-time audit.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Bank option */}
        <div
          role="button" tabIndex={0}
          onMouseEnter={() => setHover("bank")} onMouseLeave={() => setHover(null)}
          onClick={() => onNext("bank")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onNext("bank")}
          className={cn(
            "relative text-left rounded-2xl p-6 lg:p-7 hairline-strong bg-bg-card hover:hairline-ai transition group overflow-hidden cursor-default",
            hover === "bank" && "shadow-glow"
          )}
        >
          {hover === "bank" && <div className="absolute inset-0 overflow-hidden pointer-events-none ai-scan" />}
          <div className="flex items-start justify-between mb-6 relative">
            <Pill tone="ai">Recommended · live monitoring</Pill>
            <div className="w-12 h-12 rounded-xl bg-ai/10 hairline-ai flex items-center justify-center">
              <Icon name="landmark" size={22} className="text-ai" />
            </div>
          </div>
          <h2 className="text-[24px] lg:text-[28px] tracking-tight text-ink mb-2" style={{ letterSpacing: "-0.02em" }}>
            Connect bank account
          </h2>
          <p className="text-[13.5px] text-ink-mute leading-relaxed mb-5">
            Subsight monitors every recurring charge in real time. New trial? Silent price hike? You&apos;ll know within hours.
          </p>

          <div className="rounded-xl bg-bg-soft hairline p-3 mb-5 overflow-hidden">
            <div className="flex gap-3 animate-marquee-fast" style={{ width: "max-content" }}>
              {[...ACCOUNTS, ...ACCOUNTS, ...ACCOUNTS].map((b, i) => (
                <div key={i} className="flex items-center gap-2 px-3 h-9 rounded-lg bg-bg-card hairline whitespace-nowrap">
                  <ServiceMark name={b.name.split(" ")[0]} size={20} square />
                  <span className="text-[12px] text-ink-dim">{b.name}</span>
                </div>
              ))}
            </div>
          </div>

          <ul className="space-y-2 text-[12.5px] text-ink-dim mb-6">
            <li className="flex items-center gap-2"><Icon name="check" size={13} className="text-ai" /> Multiple banks · one click each</li>
            <li className="flex items-center gap-2"><Icon name="check" size={13} className="text-ai" /> Setu-powered Account Aggregator · RBI-licensed</li>
            <li className="flex items-center gap-2"><Icon name="check" size={13} className="text-ai" /> Read-only · Subsight cannot move money</li>
          </ul>

          <div className="pt-5 border-t border-bg-edge flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11.5px] font-mono text-ink-faint">
              <Icon name="shield-check" size={12} /> 256-bit AES · revocable any time
            </div>
            <Btn kind="ai" size="md" iconRight="arrow-right">Continue</Btn>
          </div>
        </div>

        {/* Upload option */}
        <div
          role="button" tabIndex={0}
          onMouseEnter={() => setHover("upload")} onMouseLeave={() => setHover(null)}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onNext("upload"); }}
          onClick={() => onNext("upload")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onNext("upload")}
          className={cn(
            "relative text-left rounded-2xl p-6 lg:p-7 bg-bg-card hairline-strong hover:hairline-ai transition group cursor-default",
            drag && "hairline-ai shadow-glow"
          )}
        >
          <div className="flex items-start justify-between mb-6">
            <Pill tone="neutral">One-time audit · no connection needed</Pill>
            <div className="w-12 h-12 rounded-xl bg-bg-soft hairline flex items-center justify-center">
              <Icon name="upload-cloud" size={22} className="text-ink-dim" />
            </div>
          </div>
          <h2 className="text-[24px] lg:text-[28px] tracking-tight text-ink mb-2" style={{ letterSpacing: "-0.02em" }}>
            Upload statement
          </h2>
          <p className="text-[13.5px] text-ink-mute leading-relaxed mb-5">
            Drag a bank statement or credit card PDF/CSV. We&apos;ll process it locally and surface every recurring charge.
          </p>

          <div className={cn(
            "rounded-xl border-2 border-dashed p-6 text-center transition",
            drag ? "border-ai bg-ai/5" : "border-bg-edge bg-bg-soft"
          )}>
            <Icon name="file-text" size={28} className={cn("mx-auto mb-2", drag ? "text-ai" : "text-ink-faint")} />
            <div className="text-[13px] text-ink">{drag ? "Drop to analyze" : "Drop file or click to browse"}</div>
            <div className="text-[11px] font-mono text-ink-faint mt-1">PDF · CSV · up to 25 MB</div>
          </div>

          <ul className="mt-5 space-y-2 text-[12.5px] text-ink-dim mb-6">
            <li className="flex items-center gap-2"><Icon name="check" size={13} className="text-ai" /> Multi-month statements supported</li>
            <li className="flex items-center gap-2"><Icon name="check" size={13} className="text-ai" /> Encrypted at rest · deleted on request</li>
            <li className="flex items-center gap-2"><Icon name="info" size={13} className="text-ink-faint" /> <span>You can <span className="text-ink">connect a bank later</span> from settings.</span></li>
          </ul>

          <div className="pt-5 border-t border-bg-edge flex items-center justify-between">
            <div className="text-[11.5px] font-mono text-ink-faint">No bank credentials required</div>
            <Btn kind="soft" size="md" iconRight="arrow-right">Upload</Btn>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-[12px] font-mono text-ink-faint">
        whichever you pick, you can <span className="text-ink-dim">add the other later</span> from settings.
      </div>
    </OnboardingShell>
  );
}

// ─── Step 2: Gmail ────────────────────────────────────────────────────────────
function Step2({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <OnboardingShell step={2} onSkip={onSkip}>
      <div className="text-center mb-10">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ai mb-3">{"// Step 2 of 3 · optional"}</div>
        <h1 className="text-[36px] lg:text-[44px] tracking-tight text-ink" style={{ letterSpacing: "-0.03em" }}>
          Add your inbox to the <span className="font-serif italic text-ai">audit</span>.
        </h1>
        <p className="mt-4 text-[15px] text-ink-mute max-w-[560px] mx-auto leading-relaxed">
          Subscriptions hide in receipts. Connect Gmail to catch trials, invoice patterns, and billing emails your bank feed misses.
        </p>
      </div>

      <div className="max-w-[660px] mx-auto">
        <div className="rounded-2xl bg-bg-card hairline-strong p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(600px at 50% 0%, oklch(0.88 0.18 125 / 0.08), transparent)" }} />
          <div className="flex items-start gap-4 mb-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-ai/10 hairline-ai flex items-center justify-center shrink-0">
              <Icon name="mail" size={26} className="text-ai" />
            </div>
            <div>
              <h2 className="text-[20px] text-ink tracking-tight mb-1">Connect Gmail</h2>
              <p className="text-[13.5px] text-ink-mute leading-relaxed">
                Subsight scans only emails matching billing keywords — receipt, invoice, subscription, trial, renewal. Never personal mail.
              </p>
            </div>
          </div>

          {/* Sample inbox preview */}
          <div className="rounded-xl bg-bg-soft hairline mb-6 overflow-hidden">
            <div className="px-3 py-2 bg-bg-edge text-[10.5px] font-mono text-ink-faint border-b border-bg-edge/60">
              inbox preview · billing emails only
            </div>
            {[
              { from: "billing@netflix.com", sub: "Your Netflix subscription receipt", tag: "Subscription", amt: "₹649" },
              { from: "no-reply@adobe.com", sub: "Adobe Creative Cloud — invoice", tag: "Invoice", amt: "₹4,719" },
              { from: "trial@midjourney.com", sub: "Your trial ends in 2 days", tag: "Trial alert", amt: "₹830" },
            ].map((m, i) => (
              <div key={i} className="px-3 py-2.5 flex items-center gap-3 border-b border-bg-edge/40 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-ink-dim truncate">{m.from}</div>
                  <div className="text-[11px] text-ink-faint font-mono truncate">{m.sub}</div>
                </div>
                <Pill tone={m.tag === "Trial alert" ? "warn" : "ai"}>{m.tag}</Pill>
                <span className="text-[11.5px] text-ink tabular-nums font-mono">{m.amt}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6 text-center">
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

          <button
            onClick={onNext}
            className="w-full h-12 rounded-xl bg-bg-card hairline-strong hover:bg-bg-edge transition flex items-center justify-center gap-3 text-[13.5px] text-ink mb-3"
          >
            <span className="w-5 h-5 rounded-[5px] bg-ink flex items-center justify-center text-bg font-medium text-[12px]">G</span>
            Connect Gmail
          </button>
          <div className="text-center text-[11.5px] text-ink-faint font-mono">
            <button onClick={onSkip} className="hover:text-ink">skip — I&apos;ll add Gmail later →</button>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

// ─── Step 3: AI Analysis ──────────────────────────────────────────────────────
const ANALYSIS_STEPS = [
  { label: "Fetching transactions", icon: "arrow-down-to-line", duration: 800 },
  { label: "Normalizing merchants", icon: "wand-2", duration: 1000 },
  { label: "Detecting recurring patterns", icon: "repeat", duration: 1200 },
  { label: "Identifying subscriptions", icon: "layers", duration: 1000 },
  { label: "Scanning Gmail receipts", icon: "mail", duration: 900 },
  { label: "Generating AI insights", icon: "sparkles", duration: 1500 },
];

const DETECTED = [
  { name: "Netflix", plan: "Premium 4K", price: 649, conf: 0.99 },
  { name: "Adobe", plan: "Creative Cloud", price: 4719, conf: 0.97 },
  { name: "Spotify", plan: "Family", price: 179, conf: 1.0 },
  { name: "Canva", plan: "Pro · Workspace #2", price: 499, conf: 0.86 },
  { name: "ChatGPT", plan: "Plus", price: 1999, conf: 0.98 },
];

function Step3({ onDone }: { onDone: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const [detectedCount, setDetectedCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let idx = 0;
    function next() {
      if (idx < ANALYSIS_STEPS.length) {
        setActiveStep(idx);
        setTimeout(() => {
          idx++;
          if (idx <= DETECTED.length) setDetectedCount(idx);
          if (idx < ANALYSIS_STEPS.length) next();
          else setTimeout(() => setDone(true), 600);
        }, ANALYSIS_STEPS[idx].duration);
      }
    }
    next();
  }, []);

  return (
    <OnboardingShell step={3} gmailAuto>
      <div className="text-center mb-10">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ai mb-3">{"// Step 3 of 3"}</div>
        <h1 className="text-[36px] lg:text-[44px] tracking-tight text-ink" style={{ letterSpacing: "-0.03em" }}>
          {done ? "Analysis complete." : <>AI is <span className="font-serif italic text-ai">scanning</span> your data.</>}
        </h1>
        <p className="mt-4 text-[15px] text-ink-mute max-w-[500px] mx-auto leading-relaxed">
          {done
            ? `Found ${detectedCount} subscriptions, ${Math.round(detectedCount * 1.8)} recurring transactions, and 6 optimization opportunities.`
            : "This takes about 30 seconds. We'll show you what we find as we go."}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 max-w-[1000px] mx-auto">
        {/* Analysis steps */}
        <div className="rounded-2xl bg-bg-card hairline p-6 space-y-3">
          {ANALYSIS_STEPS.map((s, i) => {
            const isDone = i < activeStep || done;
            const isActive = i === activeStep && !done;
            return (
              <div key={s.label} className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition",
                isDone ? "bg-good/5" : isActive ? "bg-ai/5 hairline-ai" : "opacity-40"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  isDone ? "bg-good/10 text-good" : isActive ? "bg-ai/10 text-ai" : "bg-bg-soft text-ink-faint"
                )}>
                  {isDone ? <Icon name="check" size={16} /> : isActive
                    ? <span className="animate-spin-slow"><Icon name="loader-2" size={16} /></span>
                    : <Icon name={s.icon} size={16} />}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] text-ink">{s.label}</div>
                </div>
                {isDone && <span className="text-[10px] font-mono text-good">done</span>}
                {isActive && <span className="text-[10px] font-mono text-ai">running…</span>}
              </div>
            );
          })}
        </div>

        {/* Detected subscriptions feed */}
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint mb-3">
            Detected · {detectedCount} so far
          </div>
          <div className="space-y-2">
            {DETECTED.slice(0, detectedCount).map((s) => (
              <div key={s.name} className="rounded-xl bg-bg-card hairline p-3 flex items-center gap-3 animate-slide-up">
                <ServiceMark name={s.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-ink">{s.name}</div>
                  <div className="text-[11px] text-ink-faint font-mono">{s.plan}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] text-ink tabular-nums">₹{s.price}<span className="text-ink-faint text-[10px]">/mo</span></div>
                  <div className="text-[10px] font-mono text-ai">{Math.round(s.conf * 100)}% conf</div>
                </div>
              </div>
            ))}
            {!done && detectedCount < DETECTED.length && (
              <div className="rounded-xl bg-bg-card hairline p-3 flex items-center gap-3 opacity-40">
                <div className="w-9 h-9 rounded-lg bg-bg-soft hairline" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-bg-soft rounded w-24" />
                  <div className="h-2.5 bg-bg-soft rounded w-16" />
                </div>
              </div>
            )}
          </div>

          {done && (
            <div className="mt-6 animate-fade-in">
              <Btn kind="ai" size="lg" iconRight="arrow-right" className="w-full" onClick={onDone}>
                View my subscriptions
              </Btn>
              <div className="mt-3 text-center text-[11.5px] font-mono text-ink-faint">
                <AIDot size={4} className="inline-flex mr-1" /> 6 AI insights ready · ₹6,748/mo recoverable
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardingShell>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const gmailAuto = params.get("google") === "1";
  const [step, setStep] = useState(1);
  const [, startTransition] = useTransition();

  function persist(updates: Parameters<typeof updateOnboardingState>[0]) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      startTransition(async () => {
        await updateOnboardingState(updates);
      });
    }
  }

  function goStep2(source: string) {
    persist({ step: 2, bank_connected: source === "bank", source });
    setStep(gmailAuto ? 3 : 2);
  }

  function goStep3(gmailConnected: boolean) {
    persist({ step: 3, gmail_connected: gmailConnected });
    setStep(3);
  }

  function finish() {
    startTransition(async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        await updateOnboardingState({ completed: true });
      }
      router.push("/overview");
    });
  }

  return (
    <>
      {step === 1 && <Step1 onNext={goStep2} gmailAuto={gmailAuto} />}
      {step === 2 && (
        <Step2
          onNext={() => goStep3(true)}
          onSkip={() => goStep3(false)}
        />
      )}
      {step === 3 && <Step3 onDone={finish} />}
    </>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  );
}
