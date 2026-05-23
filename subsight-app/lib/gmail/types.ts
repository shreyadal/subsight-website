// Raw Gmail API response types (subset we actually use)

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

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

// Parsed representation of a billing email
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
}

// Result of a full sync run
export interface SyncResult {
  emailsScanned: number;
  subscriptionsFound: number;
  trialsDetected: number;
  newTransactions: number;
  errors: string[];
}

// Token state for a user
export interface TokenState {
  token: string;
  gmailEmail: string;
  connectionId: string;
}
