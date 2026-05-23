import type { GmailMessageMetadata, GmailListResponse } from "./types";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    // Disable Next.js cache — we always want live data from Google
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
// Much faster than format=full; snippet covers most billing amounts.
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

// Build the Gmail search query.
// Uses after: for incremental syncs (pass 0 for a full initial sync).
export function buildSearchQuery(afterUnixSeconds = 0): string {
  const billingKeywords =
    "(subject:receipt OR subject:invoice OR subject:subscription " +
    "OR subject:billing OR subject:renewal OR subject:\"trial ends\" " +
    "OR subject:\"trial ending\" OR subject:payment OR subject:\"your order\")";

  if (afterUnixSeconds > 0) {
    return `${billingKeywords} after:${afterUnixSeconds}`;
  }
  // First sync: last 180 days
  return `${billingKeywords} newer_than:180d`;
}
