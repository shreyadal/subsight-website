"use client";

import { cn } from "@/lib/utils";
import { SERVICE_STYLES } from "@/lib/mock-data";
import { LucideIcon, icons } from "lucide-react";
import React from "react";

// ─── Icon ──────────────────────────────────────────────────────────────────
interface IconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}
export function Icon({ name, size = 16, className, strokeWidth = 1.5 }: IconProps) {
  const key = name
    .split("-")
    .filter(Boolean)
    .map((w) => (w[0] ?? "").toUpperCase() + w.slice(1))
    .join("") as keyof typeof icons;
  const LIcon = icons[key] as LucideIcon | undefined;
  if (!LIcon) return <span style={{ width: size, height: size, display: "inline-block" }} />;
  return <LIcon size={size} strokeWidth={strokeWidth} className={className} />;
}

// ─── Logo ──────────────────────────────────────────────────────────────────
export function Logo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="oklch(0.88 0.18 125)" strokeWidth="1.5" />
        <line x1="4" y1="12" x2="20" y2="12" stroke="oklch(0.88 0.18 125)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill="oklch(0.88 0.18 125)" />
      </svg>
      <span
        className="font-sans font-semibold tracking-tight text-ink"
        style={{ fontSize: size * 1.1, letterSpacing: "-0.03em" }}
      >
        Subsight
      </span>
    </div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────
type PillTone = "neutral" | "ai" | "good" | "warn" | "danger";
const pillTones: Record<PillTone, string> = {
  neutral: "bg-bg-soft text-ink-dim hairline",
  ai: "bg-ai/10 text-ai hairline-ai",
  good: "bg-good/10 text-good shadow-[inset_0_0_0_1px_oklch(0.78_0.10_155/0.25)]",
  warn: "bg-warn/10 text-warn shadow-[inset_0_0_0_1px_oklch(0.80_0.14_75/0.3)]",
  danger: "bg-danger/10 text-danger shadow-[inset_0_0_0_1px_oklch(0.72_0.16_25/0.3)]",
};
export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full text-[10.5px] font-medium tracking-tight",
        pillTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────
type BtnKind = "primary" | "ai" | "ghost" | "soft" | "outline" | "danger";
type BtnSize = "sm" | "md" | "lg";
const btnKinds: Record<BtnKind, string> = {
  primary: "bg-ink text-bg hover:bg-white",
  ai: "bg-ai text-bg hover:brightness-110 shadow-glow",
  ghost: "text-ink hover:bg-bg-soft",
  soft: "bg-bg-card text-ink hairline hover:bg-bg-edge",
  outline: "text-ink hairline-strong hover:bg-bg-soft",
  danger: "bg-danger/10 text-danger hairline hover:bg-danger/20",
};
const btnSizes: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-[12.5px] rounded-lg",
  md: "h-10 px-4 text-[13.5px] rounded-lg",
  lg: "h-12 px-5 text-[14px] rounded-xl",
};
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: BtnKind;
  size?: BtnSize;
  icon?: string;
  iconRight?: string;
  className?: string;
  children?: React.ReactNode;
}
export function Btn({ kind = "primary", size = "md", icon, iconRight, className, children, ...rest }: BtnProps) {
  const iconSize = size === "sm" ? 14 : 16;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition disabled:opacity-50",
        btnSizes[size],
        btnKinds[kind],
        className
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}

// ─── AIDot ────────────────────────────────────────────────────────────────
export function AIDot({ size = 6, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full bg-ai animate-ai-pulse" />
    </span>
  );
}

// ─── Confidence ───────────────────────────────────────────────────────────
export function Confidence({ value = 0.9, barHeight = 10, showLabel = true }: { value?: number; barHeight?: number; showLabel?: boolean }) {
  const pct = Math.round(value * 100);
  const cells = 6;
  const filled = Math.round(value * cells);
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-mute">
      <span className="inline-flex gap-[2px]">
        {Array.from({ length: cells }).map((_, i) => (
          <span
            key={i}
            className="rounded-[1.5px]"
            style={{
              width: 3,
              height: barHeight,
              background: i < filled ? "oklch(0.88 0.18 125)" : "oklch(0.28 0.008 70)",
            }}
          />
        ))}
      </span>
      {showLabel && <span>{pct}%</span>}
    </span>
  );
}

// ─── ServiceMark ──────────────────────────────────────────────────────────
export function ServiceMark({ name, size = 36, square = false }: { name: string; size?: number; square?: boolean }) {
  const s = SERVICE_STYLES[name] || {
    mono: name?.[0] || "?",
    bg: "oklch(0.26 0.005 70)",
    fg: "oklch(0.92 0.005 70)",
  };
  return (
    <span
      className={cn("inline-flex items-center justify-center font-medium shrink-0", square ? "rounded-md" : "rounded-lg")}
      style={{
        width: size,
        height: size,
        background: s.bg,
        color: s.fg,
        fontSize: size * 0.46,
        fontFamily: "var(--font-geist-sans), sans-serif",
        letterSpacing: "-0.02em",
        boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.04)",
      }}
    >
      {s.mono}
    </span>
  );
}

// ─── Placeholder ─────────────────────────────────────────────────────────
export function Placeholder({ label, ratio = "16/10", className }: { label: string; ratio?: string; className?: string }) {
  return (
    <div
      className={cn("ph-stripes rounded-xl flex items-center justify-center text-ink-faint font-mono text-[10.5px] tracking-wider", className)}
      style={{ aspectRatio: ratio }}
    >
      {label}
    </div>
  );
}
