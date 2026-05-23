import { lookupMerchant } from "./merchants";
import type { GmailMessageMetadata, ParsedEmail } from "./types";

// Amount extraction patterns — ordered most-specific first.
// We search both the subject line and the snippet.
const AMOUNT_PATTERNS = [
  /₹\s*([\d,]+(?:\.\d{1,2})?)/,       // ₹1,299 or ₹649.00
  /INR\s*([\d,]+(?:\.\d{1,2})?)/i,    // INR 299
  /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,  // Rs. 499 / Rs 179
  /\$\s*([\d,]+(?:\.\d{1,2})?)/,      // $12.99  (converted below)
];

const USD_TO_INR = 84; // fixed rate for display — not used for financial decisions

function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ""));
      if (num > 0) {
        // USD → INR conversion
        if (pattern.source.startsWith("\\$")) {
          return Math.round(num * USD_TO_INR);
        }
        return Math.round(num);
      }
    }
  }
  return null;
}

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

function detectTag(
  subject: string,
  snippet: string
): ParsedEmail["tag"] {
  const text = `${subject} ${snippet}`.toLowerCase();
  if (/trial|free period|convert/.test(text)) return "trial";
  if (/renewal|renew|auto-renew/.test(text)) return "renewal";
  if (/invoice|inv-|receipt/.test(text)) return "invoice";
  return "subscription";
}

// Returns null for emails that don't look like billing emails.
export function parseBillingEmail(
  msg: GmailMessageMetadata
): ParsedEmail | null {
  const headers = msg.payload?.headers ?? [];
  const from = getHeader(headers, "From");
  const subject = getHeader(headers, "Subject");
  const dateHeader = getHeader(headers, "Date");
  const snippet = msg.snippet ?? "";

  if (!from || !subject) return null;

  // Attempt merchant lookup — skip email if no known merchant found
  const merchant = lookupMerchant(from, subject);
  if (!merchant) return null;

  // Parse date — fall back to internalDate (Unix ms) if header is malformed
  let date: Date;
  try {
    date = dateHeader ? new Date(dateHeader) : new Date(Number(msg.internalDate));
    if (isNaN(date.getTime())) date = new Date(Number(msg.internalDate));
  } catch {
    date = new Date();
  }

  // Try to extract amount from subject first, then snippet
  const amountInr = extractAmount(subject) ?? extractAmount(snippet);

  return {
    messageId: msg.id,
    from,
    subject,
    date,
    merchantName: merchant.name,
    category: merchant.category,
    cycle: merchant.cycle,
    amountInr,
    tag: detectTag(subject, snippet),
  };
}
