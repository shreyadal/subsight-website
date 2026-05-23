import { Logo, Placeholder } from "@/components/primitives";
import { cn } from "@/lib/utils";

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-[20px] text-ink tabular-nums tracking-tight" style={{ letterSpacing: "-0.02em" }}>{n}</div>
      <div className="text-[10.5px] font-mono text-ink-faint mt-1 leading-snug">{l}</div>
    </div>
  );
}

interface AuthShellProps {
  children: React.ReactNode;
  side?: "left" | "right";
}

export function AuthShell({ children, side = "right" }: AuthShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div
        className={cn(
          "hidden lg:flex flex-col justify-between p-10 bg-bg-soft border-bg-edge",
          side === "right" ? "border-r" : "border-l order-2"
        )}
        style={{ background: "radial-gradient(800px 500px at 20% 10%, oklch(0.88 0.18 125 / 0.06), transparent 60%), oklch(0.13 0.008 70)" }}
      >
        <Logo size={22} />
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ai mb-5">{"// Field report"}</div>
          <blockquote className="text-[26px] leading-[1.2] text-ink tracking-tight max-w-[440px]" style={{ letterSpacing: "-0.02em" }}>
            <span className="font-serif italic text-ai">&ldquo;In the first week</span>, Subsight found ₹7,200 of quiet recurring spend I&apos;d forgotten about — including a Canva workspace I haven&apos;t opened since 2024.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <Placeholder label="user photo" ratio="1/1" className="w-9 !rounded-full" />
            <div className="leading-tight">
              <div className="text-[13px] text-ink">Aanya Rao</div>
              <div className="text-[10.5px] font-mono text-ink-faint">Indie founder · Bengaluru</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 max-w-[440px]">
          <Stat n="15" l="active subs · median user" />
          <Stat n="3" l="silent renewals · per month" />
          <Stat n="₹3.8k" l="saved · median first month" />
        </div>
      </div>

      {/* Form panel */}
      <div className={cn("flex items-center justify-center p-6 lg:p-10", side === "right" ? "" : "order-1")}>
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
