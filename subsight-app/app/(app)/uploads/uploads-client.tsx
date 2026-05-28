"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { Btn, Icon, Pill } from "@/components/primitives";
import { cn } from "@/lib/utils";
import type { UploadedStatement } from "@/lib/db/uploads";
import type { UploadApiResponse } from "@/lib/statements/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function confColor(c: number): string {
  if (c >= 0.85) return "text-good";
  if (c >= 0.6)  return "text-ai";
  return "text-warn";
}

// ─── Upload state machine ─────────────────────────────────────────────────────

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number; filename: string }
  | { phase: "processing"; filename: string }
  | { phase: "done"; result: UploadApiResponse; filename: string }
  | { phase: "error"; message: string; filename: string };

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  uploads: UploadedStatement[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UploadsClient({ uploads }: Props) {
  const router  = useRouter();
  // Single hidden file input — lives OUTSIDE the drop zone so its
  // click event never bubbles back up and re-triggers the drop zone handler.
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag]           = useState(false);
  const [state, setState]         = useState<UploadState>({ phase: "idle" });
  const [debugMode, setDebugMode] = useState(false);
  const [debugTab, setDebugTab]   = useState<"raw" | "normalized" | "recurring">("recurring");

  function openPicker() {
    fileRef.current?.click();
  }

  // ─── Upload function via XHR (needed for progress events) ─────────────────

  const uploadFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "csv", "xlsx", "xls", "tsv", "txt"].includes(ext)) {
      setState({ phase: "error", message: "Please upload a PDF, CSV, or Excel (.xlsx) bank statement.", filename: file.name });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setState({ phase: "error", message: "File is too large — maximum 25 MB.", filename: file.name });
      return;
    }

    setState({ phase: "uploading", progress: 0, filename: file.name });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("debug", String(debugMode));

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
        setState({ phase: "uploading", progress: pct, filename: file.name });
      }
    });

    xhr.upload.addEventListener("load", () => {
      setState({ phase: "processing", filename: file.name });
    });

    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText) as UploadApiResponse & { error?: string };
        if (xhr.status >= 200 && xhr.status < 300 && !data.error) {
          setState({ phase: "done", result: data, filename: file.name });
          router.refresh();
        } else {
          setState({ phase: "error", message: data.error ?? "Upload failed. Please try again.", filename: file.name });
        }
      } catch {
        setState({ phase: "error", message: "Unexpected server response.", filename: file.name });
      }
    });

    xhr.addEventListener("error", () => {
      setState({ phase: "error", message: "Network error — check your connection.", filename: file.name });
    });

    xhr.open("POST", "/api/statements/upload");
    xhr.send(formData);
  }, [debugMode, router]);

  // ─── Drop handlers ────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";  // reset so same file can be re-selected
  }, [uploadFile]);

  // ─── Render helpers ──────────────────────────────────────────────────────

  function renderDropZone() {
    const isActive = state.phase === "uploading" || state.phase === "processing";

    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-2xl border-2 border-dashed p-10 text-center transition",
          drag && !isActive ? "border-ai bg-ai/5" : "border-bg-edge bg-bg-soft",
          isActive && "opacity-70"
        )}
      >
        {state.phase === "uploading" && (
          <>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-ai/10">
              <Icon name="upload-cloud" size={24} className="text-ai" />
            </div>
            <div className="text-[16px] text-ink mb-2">Uploading {state.filename}…</div>
            <div className="w-full max-w-xs mx-auto bg-bg-edge rounded-full h-1.5 mt-4 mb-2 overflow-hidden">
              <div
                className="h-full bg-ai rounded-full transition-all duration-200"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <div className="text-[11.5px] font-mono text-ink-faint">{state.progress}%</div>
          </>
        )}

        {state.phase === "processing" && (
          <>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-ai/10">
              <Icon name="loader-2" size={24} className="text-ai animate-spin" />
            </div>
            <div className="text-[16px] text-ink mb-2">Parsing {state.filename}…</div>
            <div className="text-[13px] text-ink-faint">Extracting transactions · detecting recurring charges</div>
          </>
        )}

        {(state.phase === "idle" || state.phase === "done" || state.phase === "error") && (
          <>
            <div className={cn(
              "w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center",
              drag ? "bg-ai/10" : "bg-bg-card hairline"
            )}>
              <Icon name="upload-cloud" size={24} className={drag ? "text-ai" : "text-ink-dim"} />
            </div>
            <div className="text-[16px] text-ink mb-2">
              {drag ? "Drop to upload" : "Drop your statement here"}
            </div>
            <div className="text-[13px] text-ink-mute mb-4">
              PDF or CSV · up to 25 MB · HDFC · ICICI · Axis · SBI · Kotak · Amex
            </div>
            <div className="flex items-center justify-center gap-3">
              <label
                htmlFor="stmt-upload"
                className="inline-flex items-center justify-center gap-2 font-medium tracking-tight transition cursor-pointer h-10 px-4 text-[13.5px] rounded-lg bg-bg-card text-ink hairline hover:bg-bg-edge select-none"
              >
                <Icon name="folder-open" size={16} />
                <span>Browse files</span>
              </label>
              <span className="text-[12px] font-mono text-ink-faint">or drag & drop</span>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-[11.5px] font-mono text-ink-faint">
              <span className="inline-flex items-center gap-1.5"><Icon name="shield-check" size={12} /> encrypted at rest</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="trash-2" size={12} /> deleted on request</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="lock" size={12} /> never shared</span>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderResult() {
    if (state.phase === "error") {
      return (
        <div className="rounded-xl bg-danger/10 hairline px-4 py-3 flex items-center gap-2.5 text-[12.5px] text-danger">
          <Icon name="alert-circle" size={14} />
          <span>{state.message}</span>
          <button
            onClick={() => setState({ phase: "idle" })}
            className="ml-auto text-danger/60 hover:text-danger"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      );
    }

    if (state.phase !== "done") return null;
    const r = state.result;

    return (
      <div className="rounded-2xl bg-good/5 hairline overflow-hidden">
        {/* Result header */}
        <div className="px-5 py-4 flex items-center gap-4 border-b border-bg-edge">
          <div className="w-9 h-9 rounded-xl bg-good/10 flex items-center justify-center shrink-0">
            <Icon name="check-circle" size={18} className="text-good" />
          </div>
          <div>
            <div className="text-[13.5px] text-ink font-medium">{state.filename} — processed</div>
            <div className="text-[11.5px] font-mono text-ink-faint mt-0.5">
              {r.bankName} statement
              {r.periodFrom && r.periodTo && ` · ${fmtDate(r.periodFrom)} – ${fmtDate(r.periodTo)}`}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-5">
            {[
              { label: "Transactions",  value: r.transactionsInserted },
              { label: "Subscriptions", value: r.subscriptionsFound   },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[20px] tabular-nums text-ink tracking-tight">{s.value}</div>
                <div className="text-[10px] font-mono text-ink-faint">{s.label.toLowerCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Debug panel */}
        {debugMode && r.debug && (
          <div className="border-b border-bg-edge">
            {/* Tab bar */}
            <div className="flex border-b border-bg-edge px-4 pt-3">
              {(["recurring", "normalized", "raw"] as const).map((tab) => {
                const dbg = r.debug!;
                const label =
                  tab === "recurring"  ? `Recurring (${dbg.recurringGroups.length})` :
                  tab === "normalized" ? `Normalized (${dbg.normalizedTransactions.length})` :
                                        `Raw rows (${dbg.rawRows.length})`;
                return (
                <button
                  key={tab}
                  onClick={() => setDebugTab(tab)}
                  className={cn(
                    "px-3 pb-2 text-[11px] font-mono uppercase tracking-wider transition border-b-2 -mb-px",
                    debugTab === tab
                      ? "border-ai text-ai"
                      : "border-transparent text-ink-faint hover:text-ink"
                  )}
                >
                  {label}
                </button>
                );
              })}
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              {/* Recurring groups tab */}
              {debugTab === "recurring" && (
                <table className="w-full text-[11.5px]">
                  <thead className="sticky top-0 bg-bg-soft z-10">
                    <tr>
                      {["Merchant","Cycle","Amount","Confidence","Count","Avg Interval"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-edge">
                    {r.debug.recurringGroups.map((g, i) => (
                      <tr key={i} className="hover:bg-bg-soft/50 transition">
                        <td className="px-4 py-2 font-medium text-ink">{g.merchant}</td>
                        <td className="px-4 py-2 font-mono text-ink-dim">{g.cycle === "mo" ? "Monthly" : "Yearly"}</td>
                        <td className="px-4 py-2 font-mono tabular-nums text-ink">₹{g.amount.toLocaleString("en-IN")}</td>
                        <td className={cn("px-4 py-2 font-mono", confColor(g.confidence))}>
                          {(g.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-2 font-mono text-ink-dim">{g.transactionCount}</td>
                        <td className="px-4 py-2 font-mono text-ink-dim">{g.avgIntervalDays}d</td>
                      </tr>
                    ))}
                    {r.debug.recurringGroups.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-ink-faint font-mono text-[11px]">
                          No recurring groups detected
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* Normalized transactions tab */}
              {debugTab === "normalized" && (
                <table className="w-full text-[11.5px]">
                  <thead className="sticky top-0 bg-bg-soft z-10">
                    <tr>
                      {["Date","Merchant","Raw Description","Amount","Category","Method","Conf","Recurring"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-edge">
                    {r.debug.normalizedTransactions.map((t, i) => (
                      <tr key={i} className="hover:bg-bg-soft/50 transition">
                        <td className="px-4 py-2 font-mono text-ink-dim whitespace-nowrap">{t.date}</td>
                        <td className="px-4 py-2 font-medium text-ink whitespace-nowrap">{t.merchant}</td>
                        <td className="px-4 py-2 text-ink-dim max-w-[200px] truncate font-mono text-[10.5px]" title={t.rawDescription}>
                          {t.rawDescription}
                        </td>
                        <td className="px-4 py-2 font-mono tabular-nums text-ink whitespace-nowrap">₹{t.amount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2 text-ink-dim whitespace-nowrap">{t.category}</td>
                        <td className="px-4 py-2 font-mono text-ink-faint whitespace-nowrap">{t.paymentMethod}</td>
                        <td className={cn("px-4 py-2 font-mono whitespace-nowrap", confColor(t.confidence))}>
                          {(t.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-2 text-center">
                          {t.isRecurring
                            ? <Icon name="refresh-cw" size={12} className="text-ai mx-auto" />
                            : <span className="text-ink-faint">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Raw rows tab */}
              {debugTab === "raw" && (
                <table className="w-full text-[11.5px]">
                  <thead className="sticky top-0 bg-bg-soft z-10">
                    <tr>
                      {["Date","Description","Debit","Credit"].map((h) => (
                        <th key={h} className="text-left px-4 py-2 text-ink-faint font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-edge">
                    {r.debug.rawRows.map((row, i) => (
                      <tr key={i} className="hover:bg-bg-soft/50 transition">
                        <td className="px-4 py-2 font-mono text-ink-dim whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-2 text-ink-dim max-w-[300px] truncate" title={row.description}>
                          {row.description}
                        </td>
                        <td className="px-4 py-2 font-mono tabular-nums whitespace-nowrap text-danger/80">
                          {row.debit != null ? `₹${row.debit.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-4 py-2 font-mono tabular-nums whitespace-nowrap text-good">
                          {row.credit != null ? `₹${row.credit.toLocaleString("en-IN")}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-3 flex items-center gap-3 flex-wrap">
          <label
            htmlFor="stmt-upload"
            onClick={() => setState({ phase: "idle" })}
            className="text-[12.5px] font-mono text-ink-faint hover:text-ink transition cursor-pointer"
          >
            Upload another
          </label>
          <span className="text-ink-faint">·</span>
          <a href="/subscriptions" className="text-[12.5px] font-mono text-ink hover:text-ai transition">
            Subscriptions →
          </a>
          <span className="text-ink-faint">·</span>
          <a href="/insights" className="text-[12.5px] font-mono text-ai hover:underline">
            View insights →
          </a>
        </div>
      </div>
    );
  }

  // ─── Upload history ───────────────────────────────────────────────────────

  const hasRealUploads = uploads.length > 0;

  return (
    <div className="flex-1 min-w-0">
      {/* Hidden file input — position:absolute with zero size so programmatic
          .click() and native label association both work in all browsers.
          sr-only uses clip() which blocks .click() in Chrome. */}
      <input
        ref={fileRef}
        id="stmt-upload"
        type="file"
        accept=".pdf,.csv,.xlsx,.xls,.tsv,.txt"
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, overflow: "hidden", pointerEvents: "none" }}
        onChange={onFileChange}
      />
      <Topbar
        title="Uploads"
        subtitle={`${uploads.length} statements processed · ${uploads.reduce((a, u) => a + u.transaction_count, 0)} transactions extracted`}
        actions={
          <>
            <button
              onClick={() => setDebugMode((d) => !d)}
              className={cn(
                "h-8 px-3 rounded-lg text-[11.5px] font-mono transition hairline",
                debugMode
                  ? "bg-warn/10 text-warn hairline-warn"
                  : "text-ink-faint hover:text-ink bg-bg-soft"
              )}
            >
              {debugMode ? "debug ON" : "debug"}
            </button>
            {/* Use <label> so the file picker opens via native HTML — no JS .click() needed */}
            <label
              htmlFor={state.phase === "uploading" || state.phase === "processing" ? undefined : "stmt-upload"}
              className={cn(
                "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition",
                "h-8 px-3 text-[12.5px] rounded-lg select-none",
                state.phase === "uploading" || state.phase === "processing"
                  ? "opacity-50 cursor-not-allowed bg-ai text-bg"
                  : "bg-ai text-bg hover:brightness-110 shadow-glow cursor-pointer"
              )}
            >
              <Icon name="upload" size={14} />
              <span>Upload statement</span>
            </label>
          </>
        }
      />

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Drop zone */}
        {renderDropZone()}

        {/* Result / error banner */}
        {renderResult()}

        {/* Upload history */}
        <section>
          <h2 className="text-[16px] text-ink tracking-tight mb-3">Upload history</h2>

          {!hasRealUploads ? (
            <div className="rounded-2xl bg-bg-card hairline p-8 text-center">
              <div className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-2">No uploads yet</div>
              <p className="text-[13px] text-ink-dim">
                Upload a PDF or CSV bank statement to start detecting subscriptions.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-bg-card hairline overflow-hidden divide-y divide-bg-edge">
              {uploads.map((u) => (
                <div key={u.id} className="px-4 py-4 flex items-center gap-4 hover:bg-bg-soft transition">
                  <div className="w-10 h-10 rounded-xl bg-bg-soft hairline flex items-center justify-center shrink-0">
                    <Icon
                      name={u.filename.endsWith(".csv") ? "table" : "file-text"}
                      size={18}
                      className="text-ink-dim"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] text-ink truncate">{u.filename}</div>
                    <div className="font-mono text-[10.5px] text-ink-faint mt-0.5">
                      {formatFileSize(u.file_size)} · {u.bank_name ?? "Unknown bank"} · {formatDate(u.created_at)}
                      {u.period_from && u.period_to && ` · ${fmtDate(u.period_from)} – ${fmtDate(u.period_to)}`}
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-[18px] text-ink tabular-nums">{u.transaction_count}</div>
                    <div className="text-[10px] font-mono text-ink-faint">transactions</div>
                  </div>
                  <Pill
                    tone={u.status === "done" ? "good" : u.status === "error" ? "warn" : "neutral"}
                  >
                    {u.status}
                  </Pill>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bank format guide */}
        <section className="rounded-xl bg-bg-soft hairline p-4 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-faint">
            <Icon name="info" size={12} />
            Supported formats
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[12px] text-ink-dim">
            {[
              ["HDFC Bank", "Savings / Credit Card CSV"],
              ["ICICI Bank", "Statement CSV"],
              ["Axis Bank", "Transaction CSV"],
              ["SBI",       "Transaction CSV"],
              ["Kotak",     "Statement CSV"],
              ["Amex",      "Card statement CSV or PDF"],
            ].map(([bank, desc]) => (
              <div key={bank} className="flex items-start gap-1.5">
                <Icon name="check" size={12} className="text-good mt-[2px] shrink-0" />
                <span><span className="text-ink">{bank}</span> — {desc}</span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-ink-dim leading-relaxed">
            Statement uploads are a one-time audit. For live monitoring, connect a bank account from{" "}
            <a href="/accounts" className="text-ink underline-offset-2 hover:underline">Connected Accounts</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
