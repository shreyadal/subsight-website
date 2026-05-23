import { createServerClient } from "@/lib/supabase/server";
import type { Account } from "@/lib/mock-data";

type BankRow = {
  id: string;
  bank_name: string;
  account_number_last4: string;
  kind: string;
  status: string;
  color: string;
  last_synced_at: string;
};

export async function getBankConnections(): Promise<Account[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: connections, error } = await (supabase as any)
    .from("bank_connections")
    .select("id, bank_name, account_number_last4, kind, status, color, last_synced_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true }) as { data: BankRow[] | null; error: unknown };

  if (error || !connections) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subCounts } = await (supabase as any)
    .from("subscriptions")
    .select("bank_connection_id")
    .eq("user_id", user.id)
    .eq("status", "active") as { data: Array<{ bank_connection_id: string | null }> | null };

  const countMap: Record<string, number> = {};
  for (const s of subCounts ?? []) {
    if (s.bank_connection_id) {
      countMap[s.bank_connection_id] = (countMap[s.bank_connection_id] ?? 0) + 1;
    }
  }

  return connections.map((row) => ({
    id: row.id,
    name: row.bank_name,
    acct: `•• ${row.account_number_last4}`,
    kind: row.kind,
    synced: formatRelativeTime(new Date(row.last_synced_at)),
    status: row.status as "live" | "reconnect",
    subs: countMap[row.id] ?? 0,
    color: row.color,
  }));
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 2) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}
