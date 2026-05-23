"use client";

import { AIDot } from "@/components/primitives";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <div className="px-6 lg:px-8 pt-5 lg:pt-7 pb-5 border-b border-bg-edge sticky top-0 z-20 bg-bg/85 backdrop-blur-md">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10.5px] text-ink-faint tracking-wider uppercase mb-1.5">
            <AIDot size={5} />
            {subtitle || "Live · last synced 2 min ago"}
          </div>
          <h1
            className="text-[26px] lg:text-[30px] tracking-tight text-ink font-medium"
            style={{ letterSpacing: "-0.02em" }}
          >
            {title}
          </h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
