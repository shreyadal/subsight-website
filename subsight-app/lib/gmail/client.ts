import type {
  GmailMessageMetadata,
  GmailMessageFull,
  GmailMessagePart,
  GmailListResponse,
} from "./types";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) throw new Error("GMAIL_TOKEN_EXPIRED");
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

// Returns up to maxResults message IDs matching the query.
export async function listMessageIds(
  token: string,
  query: string,
  maxResults = 50
): Promise<string[]> {
  const q = encodeURIComponent(query);
  const data = await gmailFetch<GmailListResponse>(
    token,
    `/messages?q=${q}&maxResults=${maxResults}`
  );
  return (data.messages ?? []).map((m) => m.id);
}

// Fetches a single message with metadata format (headers + snippet).
// Fast — use for initial pass.
export async function getMessage(
  token: string,
  messageId: string
): Promise<GmailMessageMetadata> {
  const headers = [
    "metadataHeaders=From",
    "metadataHeaders=Subject",
    "metadataHeaders=Date",
  ].join("&");
  return gmailFetch<GmailMessageMetadata>(
    token,
    `/messages/${messageId}?format=metadata&${headers}`
  );
}

// Fetches the full message with body data.
// Only used when metadata-only parsing fails (e.g. payment processor emails
// where the actual merchant is embedded in the HTML/text body).
export async function getMessageFull(
  token: string,
  messageId: string
): Promise<GmailMessageFull> {
  return gmailFetch<GmailMessageFull>(
    token,
    `/messages/${messageId}?format=full`
  );
}

// ─── Body text extraction ─────────────────────────────────────────────────────

function decodeBase64Url(data: string): string {
  // Gmail uses URL-safe base64 (- instead of +, _ instead of /)
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  // Pad to multiple of 4
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  try {
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Recursively walks MIME parts to extract the best text content.
// Prefers text/plain; falls back to stripped text/html.
function extractFromParts(
  parts: GmailMessagePart[],
  preferHtml = false
): { plain: string; html: string } {
  let plain = "";
  let html = "";

  for (const part of parts) {
    if (part.parts) {
      const nested = extractFromParts(part.parts, preferHtml);
      if (!plain && nested.plain) plain = nested.plain;
      if (!html && nested.html) html = nested.html;
    }
    if (part.mimeType === "text/plain" && part.body?.data) {
      plain = decodeBase64Url(part.body.data);
    }
    if (part.mimeType === "text/html" && part.body?.data) {
      html = decodeBase64Url(part.body.data);
    }
  }

  return { plain, html };
}

// Returns up to 2000 characters of plain text from a full Gmail message.
// Used for merchant detection and amount extraction when snippet is insufficient.
export function extractTextFromMessage(msg: GmailMessageFull): string {
  const payload = msg.payload;
  let text = "";

  if (payload.parts) {
    const { plain, html } = extractFromParts(payload.parts);
    text = plain || stripHtml(html);
  } else if (payload.body?.data) {
    const raw = decodeBase64Url(payload.body.data);
    text = payload.mimeType === "text/html" ? stripHtml(raw) : raw;
  }

  // Also include snippet as a fallback signal
  if (!text && msg.snippet) text = msg.snippet;

  return text.slice(0, 2000);
}

// Build the Gmail search query.
// Uses after: for incremental syncs (pass 0 for a full initial sync).
//
// We search BOTH subject: and body text (plain keywords) so that emails from
// payment processors (Paddle, Chargebee, App Store, Google Play) whose billing
// words appear only in the body — not the subject — are still picked up.
// The subject: prefix hits fast server-side index; bare keywords do a content scan.
export function buildSearchQuery(afterUnixSeconds = 0): string {
  // Subject-line signals (fast index lookup)
  const subjectTerms =
    "(subject:receipt OR subject:invoice OR subject:subscription " +
    "OR subject:billing OR subject:renewal OR subject:\"trial ends\" " +
    "OR subject:\"trial ending\" OR subject:\"free trial\" OR subject:payment " +
    "OR subject:\"your order\" OR subject:\"payment confirmation\" " +
    "OR subject:\"payment receipt\" OR subject:charged OR subject:\"auto-renew\" " +
    "OR subject:statement OR subject:\"account charge\" OR subject:\"order confirmation\" " +
    "OR subject:\"thank you for your purchase\" OR subject:\"purchase confirmation\" " +
    "OR subject:\"your subscription\" OR subject:\"plan activated\" " +
    "OR subject:\"charge\" OR subject:\"amount due\" OR subject:\"due date\")";

  // Body-text fallback for processor emails (Paddle, Chargebee, App Store, etc.)
  // that embed billing info in the body but have generic subjects.
  const bodyTerms =
    "(\"payment received\" OR \"payment processed\" OR \"subscription confirmed\" " +
    "OR \"thank you for subscribing\" OR \"your plan\" OR \"auto-renewal\" " +
    "OR \"next billing date\" OR \"next charge\" OR \"charged to your\" " +
    "OR \"order total\" OR \"amount charged\" OR \"billing cycle\")";

  const combined = `(${subjectTerms} OR ${bodyTerms})`;

  if (afterUnixSeconds > 0) {
    return `${combined} after:${afterUnixSeconds}`;
  }
  // First sync: last 180 days
  return `${combined} newer_than:180d`;
}
