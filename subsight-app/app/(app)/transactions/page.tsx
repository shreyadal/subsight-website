import { getTransactions } from "@/lib/db/transactions";
import { TRANSACTIONS } from "@/lib/mock-data";
import { TransactionsClient } from "./transactions-client";

export default async function TransactionsPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const transactions = hasSupabase ? await getTransactions() : TRANSACTIONS;

  return <TransactionsClient transactions={transactions} />;
}
