"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/primitives";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: "arrow-down-to-line", label: "Ingest", sub: "bank · email · pdf" },
  { icon: "wand-2", label: "Normalize", sub: "merchant resolution" },
  { icon: "repeat", label: "Detect", sub: "recurring cadence" },
  { icon: "sparkles", label: "Reason", sub: "LLM optimization" },
  { icon: "zap", label: "Act", sub: "one-tap actions" },
];

export function AIPipeline() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative rounded-2xl bg-bg-card hairline p-6 lg:p-8">
      <div className="grid grid-cols-5 gap-2 lg:gap-4 relative">
        <div className="absolute top-7 left-[10%] right-[10%] h-px bg-bg-edge" />
        <div
          className="absolute top-7 left-[10%] h-px bg-ai transition-all duration-700"
          style={{ width: `${(active / (STEPS.length - 1)) * 80}%` }}
        />
        {STEPS.map((s, i) => {
          const on = i <= active;
          return (
            <div key={s.label} className="relative flex flex-col items-center text-center gap-3">
              <div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition relative z-10",
                  on ? "bg-ai text-bg shadow-glow" : "bg-bg-soft text-ink-faint hairline"
                )}
              >
                <Icon name={s.icon} size={20} />
              </div>
              <div>
                <div className={cn("text-[12.5px]", on ? "text-ink" : "text-ink-mute")}>{s.label}</div>
                <div className="text-[10px] font-mono text-ink-faint mt-0.5">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
