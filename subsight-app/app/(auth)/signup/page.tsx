"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Logo, Btn, Icon } from "@/components/primitives";
import { signUpWithEmail, signInWithGoogle } from "@/lib/actions/auth";

function GmailPermissionsCard() {
  return (
    <div className="rounded-xl bg-bg-card hairline-ai p-4 mt-5">
      <div className="flex items-center gap-2 mb-2.5">
        <Icon name="mail" size={14} className="text-ai" />
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-ai">
          When you continue with Google
        </span>
      </div>
      <p className="text-[12.5px] text-ink-dim leading-relaxed">
        Subsight uses <span className="text-ink">Gmail read access</span> to
        detect subscription receipts, invoices, recurring billing emails, and
        free-trial reminders. We never read personal mail, never send mail, and
        you can revoke access in one click.
      </p>
      <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="eye" size={11} /> read only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="filter" size={11} /> billing keywords
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="undo-2" size={11} /> revocable
        </span>
      </div>
    </div>
  );
}

const strengthLabel = (s: number) =>
  s <= 1
    ? "Add uppercase, number, symbol"
    : s === 2
    ? "Almost there"
    : s === 3
    ? "Strong"
    : "Excellent";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwStr, setPwStr] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    setPwStr(s);
  }, [pw]);

  const strengthColor =
    pwStr >= 3
      ? "oklch(0.78 0.10 155)"
      : pwStr === 2
      ? "oklch(0.80 0.14 75)"
      : "oklch(0.72 0.16 25)";

  function handleGoogle() {
    setError(null);
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) setError(result.error);
    });
  }

  function handleEmail() {
    if (!name || !email || !pw) {
      setError("Please fill in all fields.");
      return;
    }
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await signUpWithEmail(email, pw, name);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthShell side="left">
      <div className="lg:hidden mb-8">
        <Logo size={20} />
      </div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ai mb-4">
        {"// Create account"}
      </div>
      <h1
        className="text-[30px] tracking-tight text-ink mb-2"
        style={{ letterSpacing: "-0.025em" }}
      >
        Start your AI audit
      </h1>
      <p className="text-[13.5px] text-ink-mute mb-7">
        90 seconds. No card needed. We&apos;ll find what you forgot you were
        paying for.
      </p>

      <button
        onClick={() => {
          if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            handleGoogle();
          } else {
            router.push("/onboarding?google=1");
          }
        }}
        disabled={pending}
        className="w-full h-11 rounded-lg bg-bg-card hairline-strong hover:bg-bg-edge transition flex items-center justify-center gap-3 text-[13.5px] text-ink disabled:opacity-60"
      >
        <span className="w-5 h-5 rounded-[5px] bg-ink flex items-center justify-center text-bg font-medium text-[12px]">
          G
        </span>
        {pending ? "Redirecting…" : "Sign up with Google"}
      </button>
      <GmailPermissionsCard />

      <div className="flex items-center gap-3 my-6 text-[11px] font-mono text-ink-faint">
        <div className="flex-1 h-px bg-bg-edge" />
        <span>or with email</span>
        <div className="flex-1 h-px bg-bg-edge" />
      </div>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-danger/10 hairline text-[12.5px] text-danger">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <label className="block">
          <div className="text-[11.5px] font-mono text-ink-mute uppercase tracking-wider mb-1.5">
            Full name
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aanya Rao"
            className="w-full h-11 px-3.5 rounded-lg bg-bg-card hairline focus:hairline-ai outline-none text-[13.5px] placeholder:text-ink-faint"
          />
        </label>
        <label className="block">
          <div className="text-[11.5px] font-mono text-ink-mute uppercase tracking-wider mb-1.5">
            Work email
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.in"
            className="w-full h-11 px-3.5 rounded-lg bg-bg-card hairline focus:hairline-ai outline-none text-[13.5px] placeholder:text-ink-faint"
          />
        </label>
        <div>
          <label className="block">
            <div className="text-[11.5px] font-mono text-ink-mute uppercase tracking-wider mb-1.5">
              Password
            </div>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmail()}
              placeholder="At least 8 chars"
              className="w-full h-11 px-3.5 rounded-lg bg-bg-card hairline focus:hairline-ai outline-none text-[13.5px] placeholder:text-ink-faint"
            />
          </label>
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full"
                style={{
                  background:
                    i < pwStr ? strengthColor : "oklch(0.24 0.008 70)",
                }}
              />
            ))}
          </div>
          <div className="mt-1.5 text-[11px] font-mono text-ink-faint">
            {strengthLabel(pwStr)}
          </div>
        </div>
      </div>

      <label className="mt-5 flex items-start gap-2.5 text-[12px] text-ink-mute select-none cursor-default">
        <input type="checkbox" className="accent-ai mt-[3px]" defaultChecked />
        <span>
          I agree to the{" "}
          <span className="text-ink underline-offset-2 hover:underline">
            Terms
          </span>
          ,{" "}
          <span className="text-ink underline-offset-2 hover:underline">
            Privacy
          </span>
          , and DPDP Act consent for read-only financial data access.
        </span>
      </label>

      <div className="mt-6 space-y-3">
        <Btn
          size="lg"
          kind="ai"
          iconRight="arrow-right"
          className="w-full"
          disabled={pending}
          onClick={() => {
            if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
              handleEmail();
            } else {
              router.push("/onboarding");
            }
          }}
        >
          {pending ? "Creating account…" : "Create account"}
        </Btn>
        <div className="text-center text-[12.5px] text-ink-mute">
          Already with us?{" "}
          <Link
            href="/login"
            className="text-ink underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
