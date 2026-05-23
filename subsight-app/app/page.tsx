import Link from "next/link";
import { Logo, Btn, Icon, ServiceMark, Pill, AIDot, Placeholder } from "@/components/primitives";
import { HeroCardStack } from "@/components/landing/HeroCardStack";
import { AIPipeline } from "@/components/landing/AIPipeline";
import { SUBSCRIPTIONS, RENEWALS, NAV } from "@/lib/mock-data";
import { fmtINR } from "@/lib/utils";

// ─── Nav ────────────────────────────────────────────────────────────────────
function LandingNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-30 backdrop-blur-md bg-bg/70 border-b border-bg-edge">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <nav className="hidden md:flex items-center gap-7 text-[13px] text-ink-mute">
          <a href="#product" className="hover:text-ink">Product</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#insights" className="hover:text-ink">Insights</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
          <a href="#customers" className="hover:text-ink">Customers</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-[13px] text-ink-mute hover:text-ink px-3 h-9 inline-flex items-center">Sign in</Link>
          <Link href="/signup">
            <Btn size="sm" kind="ai" iconRight="arrow-right">Get started</Btn>
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-50 pointer-events-none"
        style={{ background: "radial-gradient(900px 400px at 18% 12%, oklch(0.88 0.18 125 / 0.10), transparent 60%), radial-gradient(700px 400px at 90% 30%, oklch(0.30 0.04 240 / 0.15), transparent 70%)" }}
      />
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full hairline bg-bg-soft text-[11.5px] text-ink-dim font-mono mb-7">
            <AIDot size={5} /> <span>AI-native · built for India · Setu-powered</span>
          </div>
          <h1 className="text-[44px] lg:text-[68px] leading-[1.02] tracking-tight text-ink" style={{ letterSpacing: "-0.035em" }}>
            The intelligence layer for your{" "}
            <span className="font-serif italic text-ai">recurring</span> spend.
          </h1>
          <p className="mt-6 text-[16px] lg:text-[17.5px] text-ink-dim leading-relaxed max-w-[520px]">
            Subsight reads your bank feed and Gmail receipts to surface every subscription, every silent price hike, every duplicate. Then it does something about it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/onboarding">
              <Btn size="lg" kind="ai" icon="landmark">Connect bank account</Btn>
            </Link>
            <Link href="/onboarding">
              <Btn size="lg" kind="outline" icon="upload">Upload statement</Btn>
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 text-[11.5px] font-mono text-ink-faint">
            <span className="inline-flex items-center gap-2"><Icon name="shield-check" size={12} /> 256-bit AES · RBI compliant</span>
            <span className="inline-flex items-center gap-2"><Icon name="lock" size={12} /> Read-only · no money moves</span>
          </div>
          <div className="mt-10 pt-8 border-t border-bg-edge grid grid-cols-3 gap-6 max-w-[520px]">
            <StatItem n="₹4.2cr" l="recurring spend audited" />
            <StatItem n="38,210" l="silent renewals caught" />
            <StatItem n="₹3,840" l="median monthly saving" />
          </div>
        </div>
        <div className="relative">
          <HeroCardStack />
        </div>
      </div>
    </section>
  );
}

function StatItem({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-[20px] text-ink tabular-nums tracking-tight" style={{ letterSpacing: "-0.02em" }}>{n}</div>
      <div className="text-[10.5px] font-mono text-ink-faint mt-1 leading-snug">{l}</div>
    </div>
  );
}

// ─── Banks rail ──────────────────────────────────────────────────────────────
function BanksRail() {
  const banks = ["HDFC", "ICICI", "Axis", "Kotak", "SBI", "HDFC", "ICICI", "Axis", "Kotak", "SBI"];
  return (
    <section className="py-12 border-y border-bg-edge bg-bg-soft/50">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10 grid md:grid-cols-[auto_1fr] items-center gap-8">
        <div className="text-[11.5px] font-mono text-ink-faint uppercase tracking-wider whitespace-nowrap">
          Account aggregation · Setu
        </div>
        <div className="overflow-hidden relative">
          <div className="flex gap-8 animate-marquee" style={{ width: "max-content" }}>
            {[...banks, ...banks].map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-ink-mute whitespace-nowrap">
                <ServiceMark name={b} size={28} square />
                <span className="text-[13.5px]">{b} Bank</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionHeading({ kicker, title, sub }: { kicker: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="max-w-[760px]">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ai mb-4">{kicker}</div>
      <h2 className="text-[32px] lg:text-[44px] leading-[1.05] tracking-tight text-ink" style={{ letterSpacing: "-0.03em" }}>
        {title}
      </h2>
      {sub && <p className="mt-4 text-[15px] text-ink-dim leading-relaxed max-w-[620px]">{sub}</p>}
    </div>
  );
}

// ─── Product preview ─────────────────────────────────────────────────────────
function ProductPreview() {
  return (
    <section id="product" className="py-20 lg:py-28 max-w-[1240px] mx-auto px-6 lg:px-10">
      <SectionHeading
        kicker="The product"
        title={<>One feed. Every recurring charge. <span className="font-serif italic text-ai">Quiet.</span></>}
        sub="The home screen is a list, not a chart. Each card is a subscription with confidence, source, and a single action the AI thinks you should take."
      />
      <div className="mt-12 relative rounded-2xl bg-bg-card hairline overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-9 flex items-center px-4 gap-2 border-b border-bg-edge bg-bg-soft">
          <span className="w-2.5 h-2.5 rounded-full bg-bg-edge" />
          <span className="w-2.5 h-2.5 rounded-full bg-bg-edge" />
          <span className="w-2.5 h-2.5 rounded-full bg-bg-edge" />
          <span className="mx-auto font-mono text-[10.5px] text-ink-faint">subsight.app/feed</span>
        </div>
        <div className="pt-9 p-6 grid lg:grid-cols-[200px_1fr_280px] gap-4 min-w-0">
          {/* Mini sidebar */}
          <div className="hidden lg:flex flex-col gap-1 text-[11px] min-w-0">
            {NAV.slice(0, 6).map((n, i) => (
              <div key={n.id} className={`flex items-center gap-2 px-2 h-7 rounded-md ${i === 1 ? "bg-bg-soft text-ink hairline" : "text-ink-faint"}`}>
                <Icon name={n.icon} size={12} />
                <span>{n.label}</span>
              </div>
            ))}
          </div>
          {/* Mini feed */}
          <div className="space-y-1.5 min-w-0">
            {SUBSCRIPTIONS.slice(0, 5).map((s) => (
              <div key={s.id} className="rounded-lg bg-bg-soft hairline p-2.5 flex items-center gap-2.5">
                <ServiceMark name={s.name} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] text-ink">{s.name}</div>
                  <div className="text-[9.5px] text-ink-faint font-mono">{s.plan}</div>
                </div>
                {s.tag && (
                  <Pill tone={s.tag === "overspend" || s.tag === "duplicate" || s.tag === "overlap" ? "warn" : s.tag === "renew-soon" ? "ai" : "neutral"}>
                    {{ overspend: "Overspending", duplicate: "Duplicate", overlap: "Overlap", "renew-soon": "Renews soon", trial: "Trial", underused: "Underused", "yearly-save": "Yearly" }[s.tag] ?? s.tag}
                  </Pill>
                )}
                <div className="text-[11.5px] text-ink tabular-nums">{fmtINR(s.price)}</div>
              </div>
            ))}
          </div>
          {/* Mini right panel */}
          <div className="hidden lg:flex flex-col gap-3 min-w-0 overflow-hidden">
            <div className="rounded-lg bg-bg-soft hairline p-3">
              <div className="text-[10px] font-mono text-ink-faint uppercase tracking-wider mb-2">Renewals · 14d</div>
              {RENEWALS.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center gap-2 py-1">
                  <ServiceMark name={r.name} size={20} />
                  <span className="text-[11px] text-ink flex-1">{r.name}</span>
                  <span className="text-[10px] font-mono text-ink-faint">{r.in}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-ai/10 hairline-ai p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AIDot size={4} />
                <span className="text-[10px] font-mono text-ai uppercase tracking-wider">AI brief</span>
              </div>
              <p className="text-[11px] text-ink-dim leading-relaxed">
                Switching Adobe to Photography plan saves ₹3,420/mo with zero loss of utility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="how" className="py-20 lg:py-28 max-w-[1240px] mx-auto px-6 lg:px-10">
      <SectionHeading
        kicker="The engine"
        title={<>AI that <span className="font-serif italic text-ai">understands</span> recurring spend, not just lists it.</>}
        sub="Five quiet passes turn raw transactions into one-tap actions. Your data never leaves a Subsight-controlled enclave."
      />
      <div className="mt-12">
        <AIPipeline />
      </div>
      <div className="mt-8 grid md:grid-cols-3 gap-3 lg:gap-4">
        {[
          { title: "Merchant graph", body: "OPENAI *CHATGPT, OPNAI-PR-WEB, OPENAI INC — all resolve to ChatGPT. Our merchant graph maps 2.3M variants." },
          { title: "Cadence inference", body: "A subscription isn't 'same name twice.' We model intervals, amounts, and trial→paid jumps to score recurrence." },
          { title: "LLM optimization", body: "Claude reads your usage pattern and billing history. It drafts actions you can accept in one tap — not generic advice." },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-xl bg-bg-card hairline">
            <div className="flex items-center gap-2 mb-2">
              <AIDot size={5} />
              <span className="text-[11px] font-mono text-ai uppercase tracking-wider">{f.title}</span>
            </div>
            <p className="text-[13px] text-ink-dim leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Awareness grid ──────────────────────────────────────────────────────────
function AwarenessGrid() {
  const items = [
    { kind: "duplicate", svc: "Canva", text: "Duplicate workspace billed", amt: "₹499/mo" },
    { kind: "trial", svc: "Midjourney", text: "Trial converts in 2 days", amt: "₹830/mo" },
    { kind: "overlap", svc: "ChatGPT", text: "Overlaps with Claude · 8× lower usage", amt: "₹1,999/mo" },
    { kind: "yearly", svc: "Figma", text: "Yearly plan saves vs current monthly", amt: "₹3,140/yr" },
    { kind: "hike", svc: "Adobe", text: "Silent price increase last cycle", amt: "+₹420/mo" },
    { kind: "underused", svc: "Notion", text: "Last opened 38 days ago", amt: "₹830/mo" },
  ];
  const toneOf: Record<string, "warn" | "good" | "ai" | "neutral"> = {
    duplicate: "warn", trial: "warn", overlap: "warn", yearly: "good", hike: "ai", underused: "neutral",
  };
  const labelOf: Record<string, string> = {
    duplicate: "Duplicate", trial: "Trial ending", overlap: "Overlap", yearly: "Yearly saves", hike: "Price hike", underused: "Underused",
  };

  return (
    <section id="insights" className="py-20 lg:py-28 relative">
      <div
        className="absolute inset-0 -z-10 opacity-50 pointer-events-none"
        style={{ background: "radial-gradient(700px 400px at 80% 50%, oklch(0.88 0.18 125 / 0.05), transparent 70%)" }}
      />
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
        <SectionHeading
          kicker="Subscription intelligence"
          title="Six things you didn't know you were paying for, last month."
          sub="Subsight runs these checks every night across every connected account and inbox."
        />
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it, i) => (
            <div key={i} className="p-5 rounded-xl bg-bg-card hairline hover:hairline-strong transition group">
              <div className="flex items-center justify-between mb-4">
                <ServiceMark name={it.svc} size={36} />
                <Pill tone={toneOf[it.kind]}>{labelOf[it.kind]}</Pill>
              </div>
              <div className="text-[15px] text-ink leading-snug tracking-tight">{it.text}</div>
              <div className="mt-4 pt-4 border-t border-bg-edge flex items-center justify-between">
                <span className="font-mono text-[11px] text-ink-faint">{it.svc.toLowerCase()}.app</span>
                <span className="font-mono text-[12px] text-ink tabular-nums">{it.amt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const list = [
    { quote: "I forgot we were paying for two Canva workspaces. Subsight surfaced it on day one and a tap fixed it.", who: "Riya M.", role: "Founder, design studio", img: "team photo" },
    { quote: 'It killed three "free trials" before they renewed silently. Pays for itself in cycle one.', who: "Aditya P.", role: "Software engineer", img: "desk photo" },
    { quote: "The right panel reads like a private analyst. Less dashboard, more decisions.", who: "Pooja S.", role: "CFO, Series-A startup", img: "office photo" },
  ];
  return (
    <section id="customers" className="py-20 lg:py-28 max-w-[1240px] mx-auto px-6 lg:px-10">
      <SectionHeading kicker="Customers" title='People stopped asking "why is my card statement so long?"' />
      <div className="mt-12 grid md:grid-cols-3 gap-3">
        {list.map((t, i) => (
          <figure key={i} className="rounded-xl bg-bg-card hairline p-6 flex flex-col">
            <Icon name="quote" size={18} className="text-ai mb-4" />
            <blockquote className="text-[15px] text-ink-dim leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-5 pt-5 border-t border-bg-edge flex items-center gap-3">
              <Placeholder label={t.img} ratio="1/1" className="w-9 !rounded-full" />
              <div className="leading-tight">
                <div className="text-[12.5px] text-ink">{t.who}</div>
                <div className="text-[10.5px] font-mono text-ink-faint">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    { name: "Personal", price: 0, sub: "For your personal stack", features: ["Up to 2 bank accounts", "Gmail sync", "AI insights · weekly", "Manual action only"], cta: "Start free", kind: "soft" as const },
    { name: "Pro", price: 299, sub: "For households & freelancers", features: ["Unlimited accounts", "Real-time AI sweeps", "One-tap pause / cancel", "Price-hike alerts", "Family seat management"], cta: "Start 14-day trial", kind: "ai" as const, highlight: true },
    { name: "Teams", price: 1499, sub: "For finance leaders", features: ["Org policy controls", "SSO & SAML", "Per-seat insights", "Audit log export", "SLA & priority support"], cta: "Book a demo", kind: "outline" as const },
  ];
  return (
    <section id="pricing" className="py-20 lg:py-28 max-w-[1240px] mx-auto px-6 lg:px-10">
      <SectionHeading
        kicker="Pricing"
        title={<>One AI analyst. <span className="font-serif italic text-ai">Yours.</span></>}
        sub="Start free. Subsight pays for itself in the first cycle or refund — that's a promise."
      />
      <div className="mt-12 grid md:grid-cols-3 gap-3 lg:gap-4">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-2xl p-6 lg:p-7 flex flex-col ${p.highlight ? "bg-bg-card hairline-ai shadow-glow" : "bg-bg-card hairline"}`}>
            <div className="flex items-baseline justify-between mb-1">
              <div className="text-[15px] text-ink">{p.name}</div>
              {p.highlight && <Pill tone="ai">Most popular</Pill>}
            </div>
            <div className="text-[11.5px] text-ink-faint mb-6">{p.sub}</div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-[42px] tabular-nums tracking-tight text-ink" style={{ letterSpacing: "-0.02em" }}>{fmtINR(p.price)}</span>
              <span className="text-[12px] text-ink-faint font-mono">/mo</span>
            </div>
            <ul className="space-y-2.5 mb-7 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-ink-dim">
                  <Icon name="check" size={14} className="text-ai mt-[2px]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup">
              <Btn kind={p.kind} size="md" className="w-full">{p.cta}</Btn>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
        <div className="rounded-2xl bg-bg-card hairline-ai p-10 lg:p-16 text-center relative overflow-hidden ai-scan">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ai mb-5">Begin</div>
          <h3 className="text-[32px] lg:text-[48px] leading-tight tracking-tight text-ink max-w-[680px] mx-auto" style={{ letterSpacing: "-0.03em" }}>
            Find out what&apos;s quietly billing you, in <span className="font-serif italic text-ai">90 seconds</span>.
          </h3>
          <p className="mt-4 text-[15px] text-ink-dim max-w-[520px] mx-auto">
            Connect a bank account or drop a statement — Subsight handles the rest.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/onboarding"><Btn size="lg" kind="ai" icon="landmark">Connect bank account</Btn></Link>
            <Link href="/onboarding"><Btn size="lg" kind="outline" icon="upload">Upload statement</Btn></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { h: "Product", links: ["Subscription feed", "Insights", "Transactions", "Gmail sync", "Mobile apps"] },
    { h: "Company", links: ["About", "Careers", "Blog", "Press", "Contact"] },
    { h: "Trust", links: ["Security", "RBI compliance", "DPDP Act", "Bug bounty", "Status"] },
    { h: "Resources", links: ["Help center", "Changelog", "API docs", "Pricing", "Refer"] },
  ];
  return (
    <footer className="border-t border-bg-edge mt-10">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-14 grid lg:grid-cols-[1.2fr_3fr] gap-10">
        <div>
          <Logo size={22} />
          <p className="mt-4 text-[12.5px] text-ink-mute leading-relaxed max-w-[280px]">
            Built in Bengaluru. Account aggregation by Setu. Encrypted end-to-end and read-only by design.
          </p>
          <div className="mt-6 flex items-center gap-3 text-ink-faint">
            <Icon name="twitter" size={16} />
            <Icon name="github" size={16} />
            <Icon name="linkedin" size={16} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {cols.map((c) => (
            <div key={c.h}>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-faint mb-3">{c.h}</div>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l} className="text-[12.5px] text-ink-mute hover:text-ink cursor-default">{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-bg-edge">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-ink-faint">© 2026 Subsight Technologies · Bengaluru, IN</div>
          <div className="text-[11px] font-mono text-ink-faint">Privacy · Terms · DPDP</div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <Hero />
      <BanksRail />
      <ProductPreview />
      <HowItWorks />
      <AwarenessGrid />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
