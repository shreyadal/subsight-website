// ─── Raw Gmail API response types ────────────────────────────────────────────

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageMetadata {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: GmailMessageHeader[];
  };
  internalDate: string; // Unix ms as string
}

export interface GmailMessagePart {
  mimeType: string;
  filename?: string;
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
}

// Full message — payload includes body data for text extraction
export interface GmailMessageFull {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    mimeType: string;
    headers: GmailMessageHeader[];
    body?: { data?: string; size?: number };
    parts?: GmailMessagePart[];
  };
  internalDate: string;
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

// ─── Parsed email representation ─────────────────────────────────────────────

export interface ParsedEmail {
  messageId: string;
  from: string;
  subject: string;
  date: Date;
  merchantName: string;
  category: string;
  cycle: "mo" | "yr";
  amountInr: number | null;
  tag: "subscription" | "invoice" | "trial" | "renewal";
  /** 0–1 confidence from whichever layer produced the match */
  confidence: number;
  /** Which detection layer resolved this email */
  detectedBy: "domain" | "processor" | "keyword" | "ai" | "heuristic";
}

// ─── AI normalizer output ─────────────────────────────────────────────────────

export interface AIEmailClassification {
  is_billing: boolean;
  merchant_name: string | null;
  category: string;
  cycle: "mo" | "yr" | "unknown";
  tag: "subscription" | "invoice" | "trial" | "renewal";
  confidence: number;
}

// ─── Sync result ──────────────────────────────────────────────────────────────

export interface SyncResult {
  emailsScanned: number;
  subscriptionsFound: number;
  trialsDetected: number;
  newTransactions: number;
  aiCallsMade: number;
  errors: string[];
}

// ─── Token state ─────────────────────────────────────────────────────────────

export interface TokenState {
  token: string;
  gmailEmail: string;
  connectionId: string;
}
