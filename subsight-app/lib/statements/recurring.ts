/**
 * Recurring subscription detector.
 *
 * Algorithm:
 *  1. Group transactions by normalized merchant name.
 *  2. For each group with ≥2 transactions, compute day-intervals.
 *  3. Score based on: cycle match · amount stability · group size.
 *  4. Groups above MIN_CONFIDENCE become DetectedSubscriptions.
 *
 * Cycle windows:
 *   Weekly     ~7  days  (5–9)
 *   Biweekly   ~14 days  (12–16)
 *   Monthly    ~30 days  (25–38)
 *   Quarterly  ~91 days  (85–100)
 *   Yearly    ~365 days  (340–390)
 */

import type { ParsedTransaction, RecurringGroup, BillingCycle } from "./types";

const MIN_CONFIDENCE = 0.45;

interface CycleSpec {
  label: string;
  cycle: BillingCycle;
  min: number;
  max: number;
  ideal: number;
}

const CYCLE_SPECS: CycleSpec[] = [
  { label: "weekly",    cycle: "mo", min: 5,   max: 9,   ideal: 7   },
  { label: "biweekly",  cycle: "mo", min: 12,  max: 16,  ideal: 14  },
  { label: "monthly",   cycle: "mo", min: 25,  max: 38,  ideal: 30  },
  { label: "quarterly", cycle: "mo", min: 85,  max: 100, ideal: 91  },
  { label: "yearly",    cycle: "yr", min: 340, max: 390, ideal: 365 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / 86_400_000;
}

function amountVariance(amounts: number[]): number {
  if (amounts.length === 0) return 1;
  const mn = Math.min(...amounts);
  const mx = Math.max(...amounts);
  return mn > 0 ? mx / mn : 1;
}

// Fuzzy-group key: lowercase, strip numbers, collapse spaces
export function merchantGroupKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── Main detector ────────────────────────────────────────────────────────────

export function detectRecurring(transactions: ParsedTransaction[]): RecurringGroup[] {
  // Only consider debits
  const debits = transactions.filter((t) => t.type === "debit" && t.amount > 0);

  // Group by fuzzy merchant key
  const groups = new Map<string, ParsedTransaction[]>();
  for (const tx of debits) {
    const key = merchantGroupKey(tx.merchant);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const result: RecurringGroup[] = [];

  for (const [, txs] of groups) {
    if (txs.length < 2) continue;

    // Sort by date ascending
    const sorted = [...txs].sort((a, b) => a.date.getTime() - b.date.getTime());
    const dates  = sorted.map((t) => t.date);
    const amounts = sorted.map((t) => t.amount);

    // Compute consecutive intervals
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(daysBetween(dates[i - 1], dates[i]));
    }

    const medInterval = median(intervals);
    const variance    = amountVariance(amounts);
    const typicalAmt  = median(amounts);

    // Find which cycle this interval matches
    let bestSpec: CycleSpec | null = null;
    let intervalScore = 0;
    for (const spec of CYCLE_SPECS) {
      if (medInterval >= spec.min && medInterval <= spec.max) {
        // Closer to ideal → higher score
        const dev   = Math.abs(medInterval - spec.ideal) / spec.ideal;
        const score = 1 - dev;
        if (score > intervalScore) {
          intervalScore = score;
          bestSpec      = spec;
        }
      }
    }

    if (!bestSpec) continue;  // interval doesn't match any known cycle

    // Amount stability score: variance = 1 → perfect; variance = 2 → 0 score
    const amountScore = Math.max(0, 1 - (variance - 1));

    // Size bonus: more data points → more confidence
    const sizeBonus = Math.min(0.2, (txs.length - 2) * 0.05);

    // Standing instruction bonus (NACH/ECS always recurring)
    const siBonus = txs.some((t) => t.paymentMethod === "NACH" || t.paymentMethod === "ECS" || t.paymentMethod === "SI") ? 0.15 : 0;

    // Known subscription merchant bonus
    const merchantBonus = txs[0].confidence >= 0.8 ? 0.1 : 0;

    const confidence = Math.min(
      1,
      intervalScore * 0.45 +
      amountScore   * 0.25 +
      sizeBonus              +
      siBonus                +
      merchantBonus
    );

    if (confidence < MIN_CONFIDENCE) continue;

    // Mark source transactions as recurring
    for (const tx of sorted) {
      tx.isRecurring    = true;
      tx.recurringCycle = bestSpec.cycle;
    }

    result.push({
      merchant:         sorted[0].merchant,
      category:         sorted[0].category,
      cycle:            bestSpec.cycle,
      typicalAmount:    typicalAmt,
      transactionDates: dates,
      avgIntervalDays:  medInterval,
      amountVariance:   variance,
      confidence,
    });
  }

  // Sort by confidence descending
  return result.sort((a, b) => b.confidence - a.confidence);
}

// ─── Subscription dedup helpers ───────────────────────────────────────────────

export function nextRenewalDate(lastDate: Date, cycle: BillingCycle): string {
  const d = new Date(lastDate);
  if (cycle === "mo") {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString().split("T")[0];
}
