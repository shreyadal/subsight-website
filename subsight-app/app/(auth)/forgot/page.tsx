"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Logo, Btn, Icon } from "@/components/primitives";
import { resetPassword } from "@/lib/actions/auth";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleReset() {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    startTransition(async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const result = await resetPassword(email);
        if (result?.error) {
          setError(result.error);
          return;
        }
      }
      setSent(true);
    });
  }

  return (
    <AuthShell>
      <div className="lg:hidden mb-8">
        <Logo size={20} />
      </div>
      <Link
        href="/login"
        className="text-[12px] text-ink-mute hover:text-ink inline-flex items-center gap-1.5 mb-6"
      >
        <Icon name="arrow-left" size={13} /> back to sign in
      </Link>

      {!sent ? (
        <>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ai mb-4">
            {"// Recover"}
          </div>
          <h1
            className="text-[30px] tracking-tight text-ink mb-2"
            style={{ letterSpacing: "-0.025em" }}
          >
            Reset your password
          </h1>
          <p className="text-[13.5px] text-ink-mute mb-7">
            We&apos;ll email you a secure link. It expires in 15 minutes.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-danger/10 hairline text-[12.5px] text-danger">
              {error}
            </div>
          )}

          <label className="block">
            <div className="text-[11.5px] font-mono text-ink-mute uppercase tracking-wider mb-1.5">
              Email
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
              placeholder="you@work.in"
              className="w-full h-11 px-3.5 rounded-lg bg-bg-card hairline focus:hairline-ai outline-none text-[13.5px] placeholder:text-ink-faint"
            />
          </label>
          <Btn
            size="lg"
            kind="ai"
            iconRight="arrow-right"
            className="w-full mt-6"
            disabled={pending}
            onClick={handleReset}
          >
            {pending ? "Sending…" : "Send reset link"}
          </Btn>
        </>
      ) : (
        <div className="text-center py-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-ai/10 hairline-ai flex items-center justify-center mb-5">
            <Icon name="mail-check" size={22} className="text-ai" />
          </div>
          <h1
            className="text-[26px] tracking-tight text-ink mb-2"
            style={{ letterSpacing: "-0.025em" }}
          >
            Check your inbox
          </h1>
          <p className="text-[13.5px] text-ink-mute leading-relaxed max-w-[320px] mx-auto">
            We sent a link to{" "}
            <span className="text-ink font-mono">{email || "you@work.in"}</span>
            . Click it within 15 minutes.
          </p>
          <Link href="/login">
            <Btn kind="soft" size="md" className="mt-7">
              Back to sign in
            </Btn>
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
