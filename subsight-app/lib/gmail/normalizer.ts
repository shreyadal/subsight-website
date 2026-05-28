/**
 * AI-assisted email classifier — Layer 4 of the detection pipeline.
 *
 * Only invoked when rule-based layers (domain, processor extraction, keyword)
 * all fail to identify a merchant. Uses OpenAI gpt-4o-mini via raw fetch so
 * no additional npm package is required.
 *
 * Gracefully degrades to null when:
 *   - OPENAI_API_KEY is not set
 *   - The API call fails
 *   - The model decides the email is not billing-related
 */

import type { AIEmailClassification } from "./types";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

// In-memory cache keyed by a lightweight fingerprint of the email.
// Prevents re-classifying the same From+Subject pair within a sync run.
const cache = new Map<string, AIEmailClassification | null>();

function cacheKey(from: string, subject: string): string {
  return `${from.toLowerCase()}:${subject.toLowerCase().slice(0, 120)}`;
}

// System prompt — stays constant, enabling prompt caching on the OpenAI side.
const SYSTEM_PROMPT = `You are a billing email classifier for a personal finance app called Subsight.
Your job: decide if an email is a billing/subscription notification, and if so, identify the actual paid service.

Key rules:
- Many billing emails arrive from PAYMENT PROCESSORS (Paddle, Stripe, Chargebee, PayPal, Apple, Google Play) on behalf of the real merchant. Look at subject/body to find the actual service name (e.g., "Receipt from Cursor" → merchant is "Cursor").
- Common payment processor subjects: "Your [Product] receipt", "Receipt from [Product]", "[Product] - Invoice #", "Payment for [Product] Pro".
- is_billing must be true ONLY for: receipts, invoices, subscription confirmations, renewal notices, trial ending alerts, payment failure alerts, billing statements. NOT for promotional, newsletter, or support emails.
- merchant_name must be the consumer-facing product name (e.g., "Cursor", "Framer", "Linear") NOT the processor name.
- category: one of: Entertainment, AI Tools, Developer, Design, Productivity, Cloud Storage, Communication, Finance, Marketing, Security, Shopping, Food, CRM, Other.
- cycle: "mo" for monthly/weekly billing, "yr" for annual/yearly, "unknown" if unclear.
- tag: "trial" if trial ending/converting, "renewal" if auto-renewal notice, "invoice" if receipt/invoice, "subscription" if general subscription confirmation.
- confidence: 0.0–1.0 how sure you are about merchant_name.
Respond ONLY with minified JSON. No markdown, no explanation.`;

// ─── Main classifier ──────────────────────────────────────────────────────────

export async function classifyWithAI(
  from: string,
  subject: string,
  snippetOrBody: string
): Promise<AIEmailClassification | null> {
  const key = cacheKey(from, subject);
  if (cache.has(key)) return cache.get(key)!;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Gracefully skip — operator hasn't configured OpenAI
    cache.set(key, null);
    return null;
  }

  const userContent =
    `From: ${from}\nSubject: ${subject}\nBody excerpt: ${snippetOrBody.slice(0, 600)}`;

  let result: AIEmailClassification | null = null;

  try {
    const res = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        max_tokens: 180,
        temperature: 0,
      }),
      // Don't cache this on the Next.js layer — always call OpenAI fresh
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[normalizer] OpenAI returned ${res.status} — skipping AI for this email`);
      cache.set(key, null);
      return null;
    }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = data.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<AIEmailClassification>;

    // Validate the response shape before trusting it
    if (
      typeof parsed.is_billing !== "boolean" ||
      !parsed.is_billing ||
      !parsed.merchant_name ||
      typeof parsed.merchant_name !== "string" ||
      parsed.merchant_name.trim().length < 1
    ) {
      cache.set(key, null);
      return null;
    }

    result = {
      is_billing: true,
      merchant_name: parsed.merchant_name.trim(),
      category: typeof parsed.category === "string" ? parsed.category : "Other",
      cycle: parsed.cycle === "yr" ? "yr" : "mo",
      tag: (["subscription", "invoice", "trial", "renewal"] as const).includes(
        parsed.tag as never
      )
        ? (parsed.tag as AIEmailClassification["tag"])
        : "subscription",
      confidence: typeof parsed.confidence === "number"
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.7,
    };
  } catch (err) {
    console.warn("[normalizer] AI classification error:", String(err));
    result = null;
  }

  cache.set(key, result);
  return result;
}

// Returns the current size of the in-memory cache (useful for logging in sync.ts).
export function getAiCallCount(): number {
  // Each cache entry that produced a non-null result = one actual API call
  return [...cache.values()].filter((v) => v !== null).length;
}

// Clears the cache — call between sync runs to avoid memory growth.
export function clearAiCache(): void {
  cache.clear();
}
