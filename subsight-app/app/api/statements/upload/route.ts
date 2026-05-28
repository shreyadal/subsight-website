/**
 * POST /api/statements/upload
 *
 * Accepts multipart/form-data with:
 *   file  — PDF or CSV bank statement (max 25 MB)
 *   debug — "true" | "false"  (include raw parsed rows in response)
 *
 * Returns UploadApiResponse (see lib/statements/types.ts).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseStatement, insertStatementResults } from "@/lib/statements/pipeline";
import type { UploadApiResponse } from "@/lib/statements/types";

// Keep this route on the Node.js runtime so pdf-parse can use fs/Buffer
export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = new Set(["application/pdf", "text/csv", "text/plain", "application/vnd.ms-excel"]);
const ALLOWED_EXTS  = new Set(["pdf", "csv", "tsv", "txt"]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse form data ────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file  = formData.get("file") as File | null;
  const debug = formData.get("debug") === "true";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // ── Validate ───────────────────────────────────────────────────────────────
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTS.has(ext) && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a PDF or CSV bank statement." },
      { status: 415 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 25 MB.` },
      { status: 413 }
    );
  }

  // ── Create uploaded_statements record ─────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: stmtRecord, error: insertErr } = await db
    .from("uploaded_statements")
    .insert({
      user_id:   user.id,
      filename:  file.name,
      file_size: file.size,
      file_type: ext === "pdf" ? "pdf" : "csv",
      status:    "processing",
    })
    .select("id")
    .single();

  if (insertErr || !stmtRecord) {
    console.error("[statements:upload] Failed to create DB record:", insertErr);
    return NextResponse.json({ error: "Failed to start processing" }, { status: 500 });
  }

  const statementId: string = stmtRecord.id;

  // ── Parse + insert ─────────────────────────────────────────────────────────
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseStatement(buffer, file.name);

    if (result.parseWarnings.length > 0) {
      console.warn(`[statements:upload] Warnings for ${file.name}:`, result.parseWarnings);
    }

    const accountLabel = `${result.bankName} Statement`;
    const summary = await insertStatementResults({
      userId:       user.id,
      statementId,
      result,
      accountLabel,
      includeDebug: debug,
    });

    const response: UploadApiResponse = {
      statementId,
      bankName:               result.bankName,
      periodFrom:             result.periodFrom?.toISOString().split("T")[0] ?? null,
      periodTo:               result.periodTo?.toISOString().split("T")[0] ?? null,
      transactionsInserted:   summary.transactionsInserted,
      subscriptionsFound:     summary.subscriptionsFound,
      recurringGroupsDetected: summary.recurringGroupsDetected,
    };

    if (debug) {
      response.debug = {
        rawRows: result.rawRows.map((r) => ({
          date:        r.date.toISOString().split("T")[0],
          description: r.description,
          debit:       r.debit,
          credit:      r.credit,
          rawLine:     r.rawLine.slice(0, 200),
        })),
        recurringGroups: result.recurringGroups.map((g) => ({
          merchant:         g.merchant,
          cycle:            g.cycle,
          amount:           g.typicalAmount,
          confidence:       g.confidence,
          transactionCount: g.transactionDates.length,
          avgIntervalDays:  Math.round(g.avgIntervalDays),
        })),
        normalizedTransactions: result.transactions.map((t) => ({
          date:          t.date.toISOString().split("T")[0],
          merchant:      t.merchant,
          rawDescription: t.rawDescription,
          amount:        t.amount,
          category:      t.category,
          paymentMethod: t.paymentMethod,
          confidence:    t.confidence,
          isRecurring:   t.isRecurring ?? false,
        })),
      };
    }

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[statements:upload] Pipeline error:", err);

    // Mark the record as errored
    await db
      .from("uploaded_statements")
      .update({ status: "error", error_message: String(err) })
      .eq("id", statementId);

    return NextResponse.json(
      { error: "Failed to process statement. Please check the file format and try again." },
      { status: 500 }
    );
  }
}
