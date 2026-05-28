/**
 * Four-layer billing email detection pipeline:
 *
 *  L1 — Domain lookup       Fast, ~100% precision for known merchant domains
 *  L2 — Processor extraction Handles Paddle/Chargebee/etc. via subject regex
 *  L3 — Keyword scan        Catches merchant names in From name / subject
 *  L4 — AI classification   gpt-4o-mini for unrecognized emails (optional)
 *
 * Only emails that pass the billing-keyword heuristic are sent to L4,
 * keeping AI call volume low.
 */

import { lookupMerchant, isPaymentProcessor, enrichMerchantInfo } from "./merchants";
import { classifyWithAI } from "./normalizer";
import type { GmailMessageMetadata, ParsedEmail } from "./types";

// ─── Amount extraction ────────────────────────────────────────────────────────

const AMOUNT_PATTERNS = [
  { re: /₹\s*([\d,]+(?:\.\d{1,2})?)/, usd: false },
  { re: /INR\s*([\d,]+(?:\.\d{1,2})?)/i, usd: false },
  { re: /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i, usd: false },
  { re: /USD\s*([\d,]+(?:\.\d{1,2})?)/i, usd: true },
  { re: /\$\s*([\d,]+(?:\.\d{1,2})?)/, usd: true },
];

const USD_TO_INR = 84;

export function extractAmount(text: string): number | null {
  for (const { re, usd } of AMOUNT_PATTERNS) {
    const m = text.match(re);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ""));
      if (num > 0 && num < 1_000_000) {
        return Math.round(usd ? num * USD_TO_INR : num);
      }
    }
  }
  return null;
}

// ─── Tag detection ────────────────────────────────────────────────────────────

function detectTag(subject: string, snippet: string): ParsedEmail["tag"] {
  const text = `${subject} ${snippet}`.toLowerCase();
  if (/\b(trial|free period|trial ends|trial ending|convert|converting)\b/.test(text))
    return "trial";
  if (/\b(renewal|renew|auto-renew|auto renew|renewing)\b/.test(text))
    return "renewal";
  if (/\b(invoice|inv-|receipt)\b/.test(text)) return "invoice";
  return "subscription";
}

// ─── Billing heuristic (gate for L4) ─────────────────────────────────────────

export function looksLikeBilling(subject: string, snippet: string): boolean {
  const text = `${subject} ${snippet}`.toLowerCase();
  const hasBillingWord =
    /\b(receipt|invoice|subscription|billing|renewal|trial|charge|payment|statement|order|charged|auto-renew)\b/.test(
      text
    );
  const hasAmount = /₹|inr|rs\.|usd|\$\s*\d/.test(text);
  return hasBillingWord || hasAmount;
}

// ─── Header helpers ───────────────────────────────────────────────────────────

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

// Extracts the display name from a "Name <email>" From header.
function extractDisplayName(from: string): string | null {
  const m = from.match(/^([^<@]+?)\s*</);
  if (m?.[1]) {
    const name = m[1].trim().replace(/["']/g, "");
    if (name.length >= 2 && name.length <= 50 && !/\d{3,}/.test(name)) return name;
  }
  return null;
}

function parseDate(dateHeader: string, internalDate: string): Date {
  try {
    const d = dateHeader ? new Date(dateHeader) : new Date(Number(internalDate));
    return isNaN(d.getTime()) ? new Date(Number(internalDate)) : d;
  } catch {
    return new Date();
  }
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export async function parseBillingEmail(
  msg: GmailMessageMetadata,
  bodyText?: string
): Promise<ParsedEmail | null> {
  const headers = msg.payload?.headers ?? [];
  const from = getHeader(headers, "From");
  const subject = getHeader(headers, "Subject");
  const dateHeader = getHeader(headers, "Date");
  const snippet = msg.snippet ?? "";

  if (!from || !subject) return null;

  const isProcessor = isPaymentProcessor(from);

  // ── L1 + L2 + L3: rule-based lookup ──────────────────────────────────────
  const merchant = lookupMerchant(from, subject);

  if (merchant) {
    const detectedBy = isProcessor ? "processor" : "domain";
    const amountText = `${subject} ${snippet} ${bodyText ?? ""}`;
    const amount = extractAmount(amountText);

    console.log(`[gmail:parser] ✓ L${isProcessor ? "2" : "1/3"} (${detectedBy}): "${from}" → ${merchant.name} | amount=${amount != null ? `₹${amount}` : "not found"}`);

    return {
      messageId: msg.id,
      from,
      subject,
      date: parseDate(dateHeader, msg.internalDate),
      merchantName: merchant.name,
      category: merchant.category,
      cycle: merchant.cycle,
      amountInr: amount,
      tag: detectTag(subject, snippet),
      confidence: isProcessor ? 0.82 : 0.95,
      detectedBy,
    };
  }

  // L1/L2/L3 failed — check if it looks billing-related before calling AI
  if (!looksLikeBilling(subject, snippet)) {
    console.log(`[gmail:parser] ✗ L1-3 miss + not billing-looking: "${subject}" — skip`);
    return null;
  }

  // ── L4: AI classifier ─────────────────────────────────────────────────────
  const context = bodyText ? `${snippet}\n${bodyText}` : snippet;
  console.log(`[gmail:parser]   L4 (AI): calling classifier for "${from}" / "${subject}"`);

  const ai = await classifyWithAI(from, subject, context);

  if (!ai || !ai.is_billing || !ai.merchant_name) {
    console.log(`[gmail:parser] ✗ L4 (AI): ${ai ? `not billing or no merchant (is_billing=${ai.is_billing})` : "null response / API error"}`);
  } else {
    const info = enrichMerchantInfo(
      ai.merchant_name,
      ai.category,
      ai.cycle === "yr" ? "yr" : "mo"
    );

    const amountText = `${subject} ${snippet} ${bodyText ?? ""}`;
    const amount = extractAmount(amountText);

    console.log(`[gmail:parser] ✓ L4 (AI): "${ai.merchant_name}" → normalized="${info.name}" category=${info.category} cycle=${info.cycle} confidence=${(ai.confidence * 100).toFixed(0)}% | amount=${amount != null ? `₹${amount}` : "not found"}`);

    return {
      messageId: msg.id,
      from,
      subject,
      date: parseDate(dateHeader, msg.internalDate),
      merchantName: info.name,
      category: info.category,
      cycle: info.cycle,
      amountInr: amount,
      tag: ai.tag,
      confidence: ai.confidence,
      detectedBy: "ai",
    };
  }

  // ── L5: From display-name fallback ──────────────────────────────────────────
  // When all 4 layers fail, extract the merchant from the From display name.
  // Only activate when the email carries an amount (i.e. a real charge email).
  const amountTextL5 = `${subject} ${snippet} ${bodyText ?? ""}`;
  const amountL5 = extractAmount(amountTextL5);
  const displayName = extractDisplayName(from);

  if (displayName && amountL5 && amountL5 > 0) {
    console.log(`[gmail:parser] ✓ L5 (heuristic): From display name "${displayName}" with amount ₹${amountL5}`);
    return {
      messageId: msg.id,
      from,
      subject,
      date: parseDate(dateHeader, msg.internalDate),
      merchantName: displayName,
      category: "Other",
      cycle: "mo",
      amountInr: amountL5,
      tag: detectTag(subject, snippet),
      confidence: 0.45,
      detectedBy: "heuristic",
    };
  }

  console.log(`[gmail:parser] ✗ All layers failed for "${from}" / "${subject}"`);
  return null;
}
