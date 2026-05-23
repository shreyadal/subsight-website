import { createServerClient } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/mock-data";

type TxRow = {
  id: string;
  merchant: string;
  norm: string;
  amount: number;
  account_label: string;
  category: string;
  recurring_confidence: number;
  transacted_at: string;
};

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("transactions")
    .select("id, merchant, norm, amount, account_label, category, recurring_confidence, transacted_at")
    .eq("user_id", user.id)
    .order("transacted_at", { ascending: false })
    .limit(100) as { data: TxRow[] | null; error: unknown };

  if (error || !data) return [];

  return data.map((row) => {
    const d = new Date(row.transacted_at);
    const month = d.toLocaleString("en-IN", { month: "short" });
    const day = d.getDate();
    return {
      id: row.id,
      date: `${month} ${day}`,
      merchant: row.merchant,
      norm: row.norm || row.merchant,
      amt: Number(row.amount),
      acct: row.account_label,
      cat: row.category,
      recurring: Number(row.recurring_confidence),
    };
  });
}
