/**
 * CSV and PDF parsers for Indian bank statements.
 *
 * Supported formats (auto-detected from headers or PDF header text):
 *   HDFC   · CSV · Date / Narration / Withdrawal Amt(INR) / Deposit Amt(INR)
 *   ICICI  · CSV · Transaction Date / Description / Debit / Credit
 *   Axis   · CSV · Tran Date / PARTICULARS / DR / CR
 *   SBI    · CSV · Txn Date / Description / Debit / Credit
 *   Kotak  · CSV · Transaction Date / Description / Debit Amount / Credit Amount
 *   Amex   · CSV · Date / Description / Amount  (negative = spend)
 *   PDF    · Text extraction for all of the above
 *   Generic· Column heuristics when no known format is detected
 */

import Papa from "papaparse";
import type { RawTransaction } from "./types";

// ─── Date parsing ─────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parseIndianDate(raw: string): Date | null {
  if (!raw?.trim()) return null;
  const s = raw.trim().replace(/\s+/g, " ");

  // ISO: 2024-05-01
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) {
    const d = new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YY or DD-MM-YY
  const dmyShort = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (dmyShort) {
    const yr = +dmyShort[3] < 50 ? 2000 + +dmyShort[3] : 1900 + +dmyShort[3];
    const d = new Date(yr, +dmyShort[2] - 1, +dmyShort[1]);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD Mon YYYY or DD-Mon-YYYY (e.g. "04 May 2024")
  const dmonY = s.match(/^(\d{1,2})[-\s]+([A-Za-z]{3})[-\s]+(\d{4})$/);
  if (dmonY) {
    const mon = MONTH_MAP[dmonY[2].toLowerCase()];
    if (mon !== undefined) {
      const d = new Date(+dmonY[3], mon, +dmonY[1]);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

// ─── Amount parsing ───────────────────────────────────────────────────────────

export function parseAmount(raw: string | undefined): number | null {
  if (!raw?.trim() || raw.trim() === "-" || raw.trim() === "0.00") return null;
  const n = parseFloat(raw.replace(/[₹,\s]/g, ""));
  return isNaN(n) || n === 0 ? null : Math.abs(n);
}

// ─── Bank format detection ────────────────────────────────────────────────────

type BankFormat = "HDFC" | "ICICI" | "Axis" | "SBI" | "Kotak" | "Amex" | "Generic";

function detectCSVFormat(headers: string[]): BankFormat {
  const h = headers.map((x) => x.trim().toLowerCase());
  const has = (sub: string) => h.some((x) => x.includes(sub));

  if (has("narration") && has("withdrawal amt"))            return "HDFC";
  if (has("narration") && has("chq./ref.no."))              return "HDFC";
  if (has("transaction date") && has("value date") && has("description") && has("debit")) return "ICICI";
  if (has("particulars") && (has(" dr") || h.includes("dr"))) return "Axis";
  if (has("txn date") && has("description"))                return "SBI";
  if (has("transaction date") && has("debit amount"))       return "Kotak";
  if (has("transaction date") && (has("withdrawal") || has("debit"))) return "Kotak";
  if (has("card member") || (h.length <= 4 && has("amount") && has("description"))) return "Amex";
  return "Generic";
}

// ─── CSV parsers ──────────────────────────────────────────────────────────────

function parseHDFC(rows: Record<string, string>[]): RawTransaction[] {
  return rows.flatMap((row): RawTransaction[] => {
    const rawLine = Object.values(row).join(" | ");
    // Find date, narration, withdrawal, deposit columns
    const dateKey   = Object.keys(row).find((k) => /date/i.test(k) && !/value/i.test(k));
    const descKey   = Object.keys(row).find((k) => /narration|description|particulars/i.test(k));
    const debitKey  = Object.keys(row).find((k) => /withdrawal|debit/i.test(k));
    const creditKey = Object.keys(row).find((k) => /deposit|credit/i.test(k));
    const balKey    = Object.keys(row).find((k) => /closing|balance/i.test(k));

    if (!dateKey || !descKey) return [];
    const date = parseIndianDate(row[dateKey]);
    if (!date) return [];
    const desc = row[descKey]?.trim();
    if (!desc || desc.length < 2) return [];

    return [{
      date,
      description: desc,
      debit:   parseAmount(debitKey  ? row[debitKey]  : undefined),
      credit:  parseAmount(creditKey ? row[creditKey] : undefined),
      balance: parseAmount(balKey    ? row[balKey]    : undefined),
      rawLine,
    }];
  });
}

function parseICICI(rows: Record<string, string>[]): RawTransaction[] {
  return rows.flatMap((row): RawTransaction[] => {
    const rawLine = Object.values(row).join(" | ");
    const dateKey   = Object.keys(row).find((k) => /transaction\s*date/i.test(k));
    const descKey   = Object.keys(row).find((k) => /description/i.test(k));
    const debitKey  = Object.keys(row).find((k) => /^debit$/i.test(k.trim()));
    const creditKey = Object.keys(row).find((k) => /^credit$/i.test(k.trim()));
    const balKey    = Object.keys(row).find((k) => /balance/i.test(k));

    if (!dateKey || !descKey) return [];
    const date = parseIndianDate(row[dateKey]);
    if (!date) return [];
    const desc = row[descKey]?.trim();
    if (!desc || desc.length < 2) return [];

    return [{
      date,
      description: desc,
      debit:   parseAmount(debitKey  ? row[debitKey]  : undefined),
      credit:  parseAmount(creditKey ? row[creditKey] : undefined),
      balance: parseAmount(balKey    ? row[balKey]    : undefined),
      rawLine,
    }];
  });
}

function parseAxis(rows: Record<string, string>[]): RawTransaction[] {
  return rows.flatMap((row): RawTransaction[] => {
    const rawLine = Object.values(row).join(" | ");
    const dateKey   = Object.keys(row).find((k) => /tran\s*date|date/i.test(k));
    const descKey   = Object.keys(row).find((k) => /particulars|description|narration/i.test(k));
    // Axis uses DR / CR (possibly with spaces)
    const debitKey  = Object.keys(row).find((k) => /^\s*dr\s*$/i.test(k) || /^withdrawal/i.test(k));
    const creditKey = Object.keys(row).find((k) => /^\s*cr\s*$/i.test(k) || /^deposit/i.test(k));
    const balKey    = Object.keys(row).find((k) => /bal/i.test(k));

    if (!dateKey || !descKey) return [];
    const date = parseIndianDate(row[dateKey]);
    if (!date) return [];
    const desc = row[descKey]?.trim();
    if (!desc || desc.length < 2) return [];

    return [{
      date,
      description: desc,
      debit:   parseAmount(debitKey  ? row[debitKey]  : undefined),
      credit:  parseAmount(creditKey ? row[creditKey] : undefined),
      balance: parseAmount(balKey    ? row[balKey]    : undefined),
      rawLine,
    }];
  });
}

function parseSBI(rows: Record<string, string>[]): RawTransaction[] {
  return rows.flatMap((row): RawTransaction[] => {
    const rawLine = Object.values(row).join(" | ");
    const dateKey   = Object.keys(row).find((k) => /txn\s*date|date/i.test(k) && !/value/i.test(k));
    const descKey   = Object.keys(row).find((k) => /description|narration|particulars/i.test(k));
    const debitKey  = Object.keys(row).find((k) => /debit/i.test(k));
    const creditKey = Object.keys(row).find((k) => /credit/i.test(k));
    const balKey    = Object.keys(row).find((k) => /balance/i.test(k));

    if (!dateKey || !descKey) return [];
    const date = parseIndianDate(row[dateKey]);
    if (!date) return [];
    const desc = row[descKey]?.trim();
    if (!desc || desc.length < 2) return [];

    return [{
      date,
      description: desc,
      debit:   parseAmount(debitKey  ? row[debitKey]  : undefined),
      credit:  parseAmount(creditKey ? row[creditKey] : undefined),
      balance: parseAmount(balKey    ? row[balKey]    : undefined),
      rawLine,
    }];
  });
}

function parseKotak(rows: Record<string, string>[]): RawTransaction[] {
  return rows.flatMap((row): RawTransaction[] => {
    const rawLine = Object.values(row).join(" | ");
    const dateKey   = Object.keys(row).find((k) => /transaction\s*date|date/i.test(k));
    const descKey   = Object.keys(row).find((k) => /description|narration|particulars/i.test(k));
    const debitKey  = Object.keys(row).find((k) => /debit\s*amount|withdrawal|debit/i.test(k));
    const creditKey = Object.keys(row).find((k) => /credit\s*amount|deposit|credit/i.test(k));
    const balKey    = Object.keys(row).find((k) => /balance/i.test(k));

    if (!dateKey || !descKey) return [];
    const date = parseIndianDate(row[dateKey]);
    if (!date) return [];
    const desc = row[descKey]?.trim();
    if (!desc || desc.length < 2) return [];

    return [{
      date,
      description: desc,
      debit:   parseAmount(debitKey  ? row[debitKey]  : undefined),
      credit:  parseAmount(creditKey ? row[creditKey] : undefined),
      balance: parseAmount(balKey    ? row[balKey]    : undefined),
      rawLine,
    }];
  });
}

function parseAmex(rows: Record<string, string>[]): RawTransaction[] {
  return rows.flatMap((row): RawTransaction[] => {
    const rawLine = Object.values(row).join(" | ");
    const dateKey   = Object.keys(row).find((k) => /^date$/i.test(k.trim()));
    const descKey   = Object.keys(row).find((k) => /description|narration/i.test(k));
    const amtKey    = Object.keys(row).find((k) => /^amount$/i.test(k.trim()));

    if (!dateKey || !descKey || !amtKey) return [];
    const date = parseIndianDate(row[dateKey]);
    if (!date) return [];
    const desc = row[descKey]?.trim();
    if (!desc || desc.length < 2) return [];

    const rawAmt = row[amtKey]?.replace(/[₹,\s]/g, "").trim();
    const numAmt = rawAmt ? parseFloat(rawAmt) : NaN;
    if (isNaN(numAmt)) return [];

    // Amex: negative = charge, positive = credit/refund
    return [{
      date,
      description: desc,
      debit:  numAmt < 0 ? Math.abs(numAmt) : null,
      credit: numAmt > 0 ? numAmt : null,
      balance: null,
      rawLine,
    }];
  });
}

function parseGeneric(rows: Record<string, string>[]): RawTransaction[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);

  // Heuristic column detection
  const dateKey   = keys.find((k) => /date/i.test(k));
  const descKey   = keys.find((k) => /desc|narr|partic|merchant|name/i.test(k)) ?? keys[1];
  const amtKeys   = keys.filter((k) => /amount|amt|debit|credit|withdrawal|deposit|dr|cr/i.test(k));

  if (!dateKey || !descKey) return [];

  return rows.flatMap((row): RawTransaction[] => {
    const rawLine = Object.values(row).join(" | ");
    const date = parseIndianDate(row[dateKey]);
    if (!date) return [];
    const desc = row[descKey]?.trim();
    if (!desc || desc.length < 2) return [];

    // Try to find debit/credit columns
    const debitKey  = amtKeys.find((k) => /debit|withdrawal|dr/i.test(k));
    const creditKey = amtKeys.find((k) => /credit|deposit|cr/i.test(k));
    const singleAmt = !debitKey && !creditKey ? amtKeys[0] : undefined;

    let debit: number | null = null;
    let credit: number | null = null;

    if (singleAmt) {
      const raw = row[singleAmt]?.replace(/[₹,\s]/g, "").trim();
      const n = raw ? parseFloat(raw) : NaN;
      if (!isNaN(n)) {
        debit  = n < 0 ? Math.abs(n) : n;  // treat all as debit for generic
      }
    } else {
      debit  = parseAmount(debitKey  ? row[debitKey]  : undefined);
      credit = parseAmount(creditKey ? row[creditKey] : undefined);
    }

    return [{ date, description: desc, debit, credit, balance: null, rawLine }];
  });
}

// ─── CSV entry point ──────────────────────────────────────────────────────────

export function parseCSV(csvText: string): { rows: RawTransaction[]; bankName: string } {
  // Strip BOM
  const text = csvText.replace(/^﻿/, "");

  type ParseOut = { data: Record<string, string>[]; errors: { message: string }[]; meta: { fields?: string[] } };
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  }) as ParseOut;

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  const headers = result.meta.fields ?? [];
  const format  = detectCSVFormat(headers);

  let rows: RawTransaction[];
  switch (format) {
    case "HDFC":    rows = parseHDFC(result.data);    break;
    case "ICICI":   rows = parseICICI(result.data);   break;
    case "Axis":    rows = parseAxis(result.data);    break;
    case "SBI":     rows = parseSBI(result.data);     break;
    case "Kotak":   rows = parseKotak(result.data);   break;
    case "Amex":    rows = parseAmex(result.data);    break;
    default:        rows = parseGeneric(result.data); break;
  }

  return { rows, bankName: format };
}

// ─── PDF entry point ──────────────────────────────────────────────────────────

export async function parsePDF(buffer: Buffer): Promise<{ rows: RawTransaction[]; bankName: string }> {
  // Dynamic import keeps pdf-parse out of the webpack bundle (it reads test
  // files at module-init time — serverExternalPackages in next.config.ts
  // ensures it runs as a native Node.js require in API route handlers).
  // pdf-parse ships both CJS and ESM; normalise to the callable function
  const pdfMod = await import("pdf-parse");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (pdfMod as any).default ?? pdfMod;
  let text: string;
  try {
    const data = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer);
    text = data.text;
  } catch (err) {
    throw new Error(`PDF extraction failed: ${String(err)}`);
  }

  const bankName = detectBankFromPDFText(text);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 5);

  const rows = parsePDFLines(lines, bankName);
  return { rows, bankName };
}

function detectBankFromPDFText(text: string): BankFormat {
  const t = text.slice(0, 2000).toLowerCase();
  if (t.includes("hdfc bank"))   return "HDFC";
  if (t.includes("icici bank"))  return "ICICI";
  if (t.includes("axis bank"))   return "Axis";
  if (t.includes("state bank"))  return "SBI";
  if (t.includes("kotak mahindra") || t.includes("kotak bank")) return "Kotak";
  if (t.includes("american express") || t.includes("amex")) return "Amex";
  return "Generic";
}

// Shared regex for a transaction line in a PDF bank statement.
// Pattern: DATE  <description text>  DEBIT?  CREDIT?  BALANCE?
const PDF_TX_RE =
  /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](?:\d{2}|\d{4}))\s+(.{4,80?}?)\s+([\d,]+\.\d{2})\s*([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?$/;

function parsePDFLines(lines: string[], _bankName: BankFormat): RawTransaction[] {
  const out: RawTransaction[] = [];
  for (const line of lines) {
    const m = line.match(PDF_TX_RE);
    if (!m) continue;
    const date = parseIndianDate(m[1]);
    if (!date) continue;
    const desc = m[2].trim();
    if (desc.length < 3) continue;

    // Without a separate debit/credit column header we can't distinguish —
    // treat the first amount as debit (most statements list withdrawal first).
    const amt1 = parseAmount(m[3]);
    const amt2 = parseAmount(m[4]);
    const bal  = parseAmount(m[5]);

    out.push({
      date,
      description: desc,
      debit:   amt1,
      credit:  amt2,  // could be wrong — corrected below with heuristic
      balance: bal ?? parseAmount(m[4]),
      rawLine: line,
    });
  }

  // If no rows matched, try a looser pattern (some PDFs don't have trailing balance)
  if (out.length === 0) {
    const LOOSE_RE = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](?:\d{2}|\d{4}))\s+(.{4,}?)\s+([\d,]+\.\d{2})/;
    for (const line of lines) {
      const m = line.match(LOOSE_RE);
      if (!m) continue;
      const date = parseIndianDate(m[1]);
      if (!date) continue;
      const desc = m[2].trim();
      if (desc.length < 3) continue;
      out.push({
        date,
        description: desc,
        debit:   parseAmount(m[3]),
        credit:  null,
        balance: null,
        rawLine: line,
      });
    }
  }

  return out;
}

// ─── Period detection from raw rows ──────────────────────────────────────────

export function detectPeriod(rows: RawTransaction[]): { from: Date | null; to: Date | null } {
  const dates = rows.map((r) => r.date).filter(Boolean) as Date[];
  if (dates.length === 0) return { from: null, to: null };
  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
  return { from: sorted[0], to: sorted[sorted.length - 1] };
}
