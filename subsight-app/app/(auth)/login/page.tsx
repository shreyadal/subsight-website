"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Logo, Btn, Icon } from "@/components/primitives";
import { signInWithEmail, signInWithGoogle } from "@/lib/actions/auth";

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("aanya@acme.in");
  const [pw, setPw] = useState("");
  const [showGmail, setShowGmail] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "Authentication failed. Please try again." : null
  );
  const [pending, startTransition] = useTransition();

  function handleGoogle() {
    setError(null);
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) setError(result.error);
    });
  }

  function handleEmail() {
    if (!email || !pw) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await signInWithEmail(email, pw);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AuthShell>
      <div className="lg:hidden mb-8">
        <Logo size={20} />
      </div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ai mb-4">
        {"// Welcome back"}
      </div>
      <h1
        className="text-[30px] tracking-tight text-ink mb-2"
        style={{ letterSpacing: "-0.025em" }}
      >
        Sign in to Subsight
      </h1>
      <p className="text-[13.5px] text-ink-mute mb-7">
        Continue auditing your recurring spend.
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
        {pending ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="mt-4 text-[11.5px] text-ink-faint leading-relaxed">
        Continuing with Google also connects Gmail so Subsight can detect
        receipts and trials.{" "}
        <button
          onClick={() => setShowGmail((s) => !s)}
          className="text-ink underline-offset-2 hover:underline"
        >
          {showGmail ? "hide details" : "what we access"}
        </button>
      </div>
      {showGmail && <GmailPermissionsCard />}

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
            Email
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@work.in"
            className="w-full h-11 px-3.5 rounded-lg bg-bg-card hairline focus:hairline-ai outline-none text-[13.5px] placeholder:text-ink-faint"
          />
        </label>
        <label className="block">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] font-mono text-ink-mute uppercase tracking-wider">
              Password
            </span>
            <Link
              href="/forgot"
              className="text-[11px] text-ink-faint hover:text-ink"
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmail()}
            placeholder="••••••••"
            className="w-full h-11 px-3.5 rounded-lg bg-bg-card hairline focus:hairline-ai outline-none text-[13.5px] placeholder:text-ink-faint"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-[12px] text-ink-mute select-none cursor-default">
        <input type="checkbox" className="accent-ai" defaultChecked />
        Keep me signed in on this device
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
          {pending ? "Signing in…" : "Sign in"}
        </Btn>
        <div className="text-center text-[12.5px] text-ink-mute">
          No account yet?{" "}
          <Link
            href="/signup"
            className="text-ink underline-offset-2 hover:underline"
          >
            Create one
          </Link>
        </div>
      </div>

      <div className="mt-10 pt-5 border-t border-bg-edge text-[11px] font-mono text-ink-faint flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="shield-check" size={11} /> SOC2 · DPDP Act
        </span>
        <span>v1.4</span>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
