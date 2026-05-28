export type BillingCycle = "mo" | "yr";
export type TransactionType = "debit" | "credit";

// ─── Raw output from bank parser (pre-normalization) ─────────────────────────

export interface RawTransaction {
  date: Date;
  description: string;     // original text from the statement
  debit: number | null;    // withdrawal amount in INR
  credit: number | null;   // deposit amount in INR
  balance: number | null;
  rawLine: string;         // the verbatim source row (for debug)
}

// ─── Normalized, categorized transaction ─────────────────────────────────────

export interface ParsedTransaction {
  date: Date;
  merchant: string;           // canonical merchant name
  rawDescription: string;     // original description before normalization
  amount: number;             // always positive INR
  type: TransactionType;
  category: string;
  paymentMethod: string;      // UPI | NACH | ECS | CARD | NEFT | ATM | OTHER
  confidence: number;         // 0–1 merchant normalization confidence
  isRecurring?: boolean;
  recurringCycle?: BillingCycle;
}

// ─── A group of transactions that share cadence + merchant ────────────────────

export interface RecurringGroup {
  merchant: string;
  category: string;
  cycle: BillingCycle;
  typicalAmount: number;      // median amount across group
  transactionDates: Date[];
  avgIntervalDays: number;
  amountVariance: number;     // max/min ratio; 1.0 = perfectly stable
  confidence: number;         // 0–1 composite score
}

// ─── Full result from the parsing pipeline ───────────────────────────────────

export interface StatementParseResult {
  bankName: string;           // "HDFC" | "ICICI" | "Axis" | "SBI" | "Kotak" | "Amex" | "Generic"
  periodFrom: Date | null;
  periodTo: Date | null;
  rawRows: RawTransaction[];          // all rows before any filtering (for debug)
  transactions: ParsedTransaction[];  // filtered + normalized debit transactions
  recurringGroups: RecurringGroup[];  // detected recurring subscription groups
  parseWarnings: string[];            // non-fatal issues (e.g. skipped malformed rows)
}

// ─── What the upload API returns to the client ────────────────────────────────

export interface UploadApiResponse {
  statementId: string;
  bankName: string;
  periodFrom: string | null;
  periodTo: string | null;
  transactionsInserted: number;
  subscriptionsFound: number;
  recurringGroupsDetected: number;
  debug?: {
    rawRows: Array<{
      date: string;
      description: string;
      debit: number | null;
      credit: number | null;
      rawLine: string;
    }>;
    recurringGroups: Array<{
      merchant: string;
      cycle: string;
      amount: number;
      confidence: number;
      transactionCount: number;
      avgIntervalDays: number;
    }>;
    normalizedTransactions: Array<{
      date: string;
      merchant: string;
      rawDescription: string;
      amount: number;
      category: string;
      paymentMethod: string;
      confidence: number;
      isRecurring: boolean;
    }>;
  };
}
