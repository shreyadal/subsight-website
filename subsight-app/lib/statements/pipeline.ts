/**
 * Statement ingestion pipeline.
 *
 * Flow:
 *   buffer/text  →  bank-parser (raw rows)
 *               →  normalization (ParsedTransaction[])
 *               →  recurring detector (RecurringGroup[])
 *               →  DB inserts: transactions · subscriptions · ai_insights
 *               →  update uploaded_statements record
 *
 * All inserted rows carry is_demo = false so they survive the demo-data cleanup
 * that runs at the start of Gmail sync.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { parseCSV, parsePDF, detectPeriod } from "./bank-parsers";
import { normalizeMerchant, shouldSkipTransaction } from "./merchant-map";
import { detectRecurring, nextRenewalDate } from "./recurring";
import type {
  RawTransaction,
  ParsedTransaction,
  StatementParseResult,
} from "./types";

// ─── Normalize raw rows into ParsedTransactions ───────────────────────────────

function normalizeRows(raw: RawTransaction[]): ParsedTransaction[] {
  const out: ParsedTransaction[] = [];
  for (const row of raw) {
    // Skip non-purchase rows (ATM, NEFT, bank fees, etc.)
    if (shouldSkipTransaction(row.description)) continue;

    // Only process debit (expense) transactions; credits are not subscriptions
    const amount = row.debit ?? 0;
    if (amount <= 0) continue;

    const norm = normalizeMerchant(row.description);

    out.push({
      date:            row.date,
      merchant:        norm.name,
      rawDescription:  row.description,
      amount,
      type:            "debit",
      category:        norm.category,
      paymentMethod:   norm.paymentMethod,
      confidence:      norm.confidence,
    });
  }
  return out;
}

// ─── Main parse function (file-type dispatch) ─────────────────────────────────

export async function parseStatement(
  buffer: Buffer,
  filename: string
): Promise<StatementParseResult> {
  const ext = filename.split(".").pop()?.toLowerCase();
  const warnings: string[] = [];

  let rawRows: RawTransaction[];
  let bankName: string;

  if (ext === "pdf") {
    try {
      const result = await parsePDF(buffer);
      rawRows  = result.rows;
      bankName = result.bankName;
    } catch (err) {
      warnings.push(`PDF extraction error: ${String(err)}`);
      rawRows  = [];
      bankName = "Unknown";
    }
  } else {
    // CSV / TSV
    const text = buffer.toString("utf-8").replace(/^﻿/, ""); // strip BOM
    try {
      const result = parseCSV(text);
      rawRows  = result.rows;
      bankName = result.bankName;
    } catch (err) {
      warnings.push(`CSV parse error: ${String(err)}`);
      rawRows  = [];
      bankName = "Unknown";
    }
  }

  if (rawRows.length === 0) {
    warnings.push("No transaction rows could be extracted from this file.");
  }

  const transactions    = normalizeRows(rawRows);
  const recurringGroups = detectRecurring(transactions);
  const { from, to }    = detectPeriod(rawRows);

  console.log(`[statements:pipeline] Parsed ${rawRows.length} raw rows → ${transactions.length} transactions → ${recurringGroups.length} recurring groups (bank=${bankName})`);

  return { bankName, periodFrom: from, periodTo: to, rawRows, transactions, recurringGroups, parseWarnings: warnings };
}

// ─── DB insertion ─────────────────────────────────────────────────────────────

interface InsertOptions {
  userId:      string;
  statementId: string;
  result:      StatementParseResult;
  accountLabel: string;   // e.g. "HDFC Statement"
  includeDebug: boolean;
}

interface InsertSummary {
  transactionsInserted: number;
  subscriptionsFound:   number;
  recurringGroupsDetected: number;
}

export async function insertStatementResults(opts: InsertOptions): Promise<InsertSummary> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const { userId, statementId, result, accountLabel } = opts;

  let transactionsInserted = 0;
  let subscriptionsFound   = 0;

  // ── 1. Insert transactions (dedup by merchant + amount + ±2 days) ──────────
  for (const tx of result.transactions) {
    try {
      // Dedup check
      const lower = new Date(tx.date);
      lower.setDate(lower.getDate() - 2);
      const upper = new Date(tx.date);
      upper.setDate(upper.getDate() + 2);

      const { count } = await db
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .ilike("merchant", tx.merchant)
        .eq("amount", tx.amount)
        .gte("transacted_at", lower.toISOString())
        .lte("transacted_at", upper.toISOString());

      if ((count ?? 0) > 0) {
        console.log(`[statements:pipeline]   ↩ Duplicate tx skipped: ${tx.merchant} ₹${tx.amount} on ${tx.date.toISOString().split("T")[0]}`);
        continue;
      }

      await db.from("transactions").insert({
        user_id:              userId,
        is_demo:              false,
        merchant:             tx.rawDescription.slice(0, 80),
        norm:                 tx.merchant,
        amount:               tx.amount,
        currency:             "INR",
        type:                 "debit",
        category:             tx.category,
        account_label:        accountLabel,
        recurring_confidence: tx.isRecurring ? Math.max(tx.confidence, 0.7) : tx.confidence * 0.3,
        transacted_at:        tx.date.toISOString(),
      });
      transactionsInserted++;
      console.log(`[statements:pipeline]   ✓ Inserted tx: ${tx.merchant} ₹${tx.amount}${tx.isRecurring ? " [recurring]" : ""}`);
    } catch (err) {
      console.warn(`[statements:pipeline]   ✗ tx insert error for ${tx.merchant}: ${String(err)}`);
    }
  }

  // ── 2. Insert subscriptions from recurring groups ──────────────────────────
  for (const group of result.recurringGroups) {
    try {
      // Check if subscription already exists
      const { count } = await db
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .ilike("name", group.merchant);

      if ((count ?? 0) > 0) {
        console.log(`[statements:pipeline]   ↩ Duplicate subscription skipped: "${group.merchant}"`);
        continue;
      }

      const lastDate = group.transactionDates[group.transactionDates.length - 1];
      const renewal  = nextRenewalDate(lastDate, group.cycle);

      await db.from("subscriptions").insert({
        user_id:           userId,
        is_demo:           false,
        name:              group.merchant,
        plan:              "",
        price:             group.typicalAmount,
        currency:          "INR",
        cycle:             group.cycle,
        category:          group.category,
        status:            "active",
        detected_by:       "bank",
        confidence:        group.confidence,
        source_label:      accountLabel,
        renew_label:       group.cycle === "mo" ? "Monthly" : "Yearly",
        next_renewal_date: renewal,
        ai_tag:            null,
        ai_insight:        `Detected via ${result.bankName} statement — ${group.transactionDates.length} charges found`,
      });
      subscriptionsFound++;
      console.log(`[statements:pipeline]   ✓ Inserted subscription: "${group.merchant}" ₹${group.typicalAmount}/${group.cycle} (conf=${(group.confidence * 100).toFixed(0)}%)`);

      // Generate ai_insight for high-value subscriptions
      if (group.typicalAmount >= 500 && group.confidence >= 0.7) {
        const yearlySpend = group.cycle === "mo" ? group.typicalAmount * 12 : group.typicalAmount;
        await db.from("ai_insights").insert({
          user_id:      userId,
          is_demo:      false,
          kind:         "savings",
          title:        `${group.merchant} — ₹${yearlySpend.toLocaleString("en-IN")}/yr`,
          amount:       group.typicalAmount,
          period:       group.cycle,
          body:         `Detected ${group.transactionDates.length} recurring charges in your ${result.bankName} statement. Avg interval: ${Math.round(group.avgIntervalDays)} days.`,
          action_label: "Review subscription",
          services:     [group.merchant],
          status:       "active",
        });
      }
    } catch (err) {
      console.warn(`[statements:pipeline]   ✗ subscription insert error for ${group.merchant}: ${String(err)}`);
    }
  }

  // ── 3. Update uploaded_statements record ───────────────────────────────────
  const debugRows = opts.includeDebug
    ? result.rawRows.map((r) => ({
        date:        r.date.toISOString().split("T")[0],
        description: r.description,
        debit:       r.debit,
        credit:      r.credit,
        rawLine:     r.rawLine,
      }))
    : null;

  await db
    .from("uploaded_statements")
    .update({
      status:           "done",
      bank_name:        result.bankName,
      period_from:      result.periodFrom?.toISOString().split("T")[0] ?? null,
      period_to:        result.periodTo?.toISOString().split("T")[0] ?? null,
      transaction_count: transactionsInserted,
      recurring_found:  subscriptionsFound,
      source_label:     accountLabel,
      processed_at:     new Date().toISOString(),
      debug_rows:       debugRows,
    })
    .eq("id", statementId);

  console.log(`[statements:pipeline] ── Done: ${transactionsInserted} transactions · ${subscriptionsFound} subscriptions (${result.bankName})`);

  return {
    transactionsInserted,
    subscriptionsFound,
    recurringGroupsDetected: result.recurringGroups.length,
  };
}
