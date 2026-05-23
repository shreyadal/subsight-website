"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Btn, Icon, Pill } from "@/components/primitives";
import { cn } from "@/lib/utils";
import type { UploadedStatement } from "@/lib/db/uploads";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

const STATIC_UPLOADS = [
  { name: "HDFC_Statement_Apr.pdf", size: "1.4 MB", when: "Apr 30", status: "processed", extracted: 18, acct: "HDFC •• 4421" },
  { name: "ICICI_Statement_Apr.pdf", size: "982 KB", when: "Apr 28", status: "processed", extracted: 11, acct: "ICICI •• 8810" },
  { name: "Axis_CC_Apr.csv", size: "214 KB", when: "Apr 27", status: "processed", extracted: 9, acct: "Axis •• 1102" },
  { name: "HDFC_Statement_Mar.pdf", size: "1.2 MB", when: "Mar 31", status: "processed", extracted: 16, acct: "HDFC •• 4421" },
];

interface Props {
  uploads: UploadedStatement[];
}

export function UploadsClient({ uploads }: Props) {
  const [drag, setDrag] = useState(false);

  const displayUploads = uploads.length > 0
    ? uploads.map((u) => ({
        name: u.filename,
        size: formatFileSize(u.file_size),
        when: formatDate(u.created_at),
        status: u.status,
        extracted: u.transaction_count,
        acct: u.bank_name ?? "—",
      }))
    : STATIC_UPLOADS;

  const totalExtracted = displayUploads.reduce((a, u) => a + u.extracted, 0);

  return (
    <div className="flex-1 min-w-0">
      <Topbar
        title="Uploads"
        subtitle={`${displayUploads.length} statements processed · ${totalExtracted} subscriptions extracted`}
        actions={<Btn size="sm" kind="ai" icon="upload">Upload statement</Btn>}
      />

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); }}
          className={cn(
            "rounded-2xl border-2 border-dashed p-10 text-center transition",
            drag ? "border-ai bg-ai/5" : "border-bg-edge bg-bg-soft"
          )}
        >
          <div className={cn("w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center",
            drag ? "bg-ai/10" : "bg-bg-card hairline"
          )}>
            <Icon name="upload-cloud" size={24} className={drag ? "text-ai" : "text-ink-dim"} />
          </div>
          <div className="text-[16px] text-ink mb-2">{drag ? "Drop to upload" : "Drop your statement here"}</div>
          <div className="text-[13px] text-ink-mute mb-4">PDF or CSV · up to 25 MB · bank or credit card statements</div>
          <div className="flex items-center justify-center gap-3">
            <Btn kind="soft" size="md" icon="folder-open">Browse files</Btn>
            <span className="text-[12px] font-mono text-ink-faint">or drag anywhere on this page</span>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-[11.5px] font-mono text-ink-faint">
            <span className="inline-flex items-center gap-1.5"><Icon name="shield-check" size={12} /> encrypted at rest</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="trash-2" size={12} /> deleted on request</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="lock" size={12} /> never shared</span>
          </div>
        </div>

        {/* Upload history */}
        <section>
          <h2 className="text-[16px] text-ink tracking-tight mb-3">Upload history</h2>
          <div className="rounded-2xl bg-bg-card hairline overflow-hidden">
            {displayUploads.map((f, i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-4 border-b border-bg-edge last:border-0 hover:bg-bg-soft transition">
                <div className="w-10 h-10 rounded-xl bg-bg-soft hairline flex items-center justify-center shrink-0">
                  <Icon name={f.name.endsWith(".csv") ? "table" : "file-text"} size={18} className="text-ink-dim" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-ink truncate">{f.name}</div>
                  <div className="font-mono text-[10.5px] text-ink-faint mt-0.5">
                    {f.size} · {f.acct} · uploaded {f.when}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[18px] text-ink tabular-nums">{f.extracted}</div>
                  <div className="text-[10px] font-mono text-ink-faint">extracted</div>
                </div>
                <Pill tone={f.status === "done" || f.status === "processed" ? "good" : f.status === "error" ? "warn" : "neutral"}>
                  {f.status}
                </Pill>
                <button className="text-ink-faint hover:text-danger"><Icon name="trash-2" size={15} /></button>
              </div>
            ))}
          </div>
        </section>

        {/* Info */}
        <div className="rounded-xl bg-bg-soft hairline p-4 flex items-start gap-3 text-[12.5px] text-ink-dim leading-relaxed">
          <Icon name="info" size={14} className="text-ink-faint mt-[2px]" />
          <p>
            Statement uploads are a one-time audit. For live monitoring, connect a bank account — it&apos;s faster and auto-updates.
            You can do both from <a href="/accounts" className="text-ink underline-offset-2 hover:underline">Connected Accounts</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
