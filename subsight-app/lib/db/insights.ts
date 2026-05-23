import { createServerClient } from "@/lib/supabase/server";
import type { Insight } from "@/lib/mock-data";

type InsightRow = {
  id: string;
  kind: string;
  title: string;
  amount: number;
  period: string;
  body: string;
  action_label: string;
  services: string[];
};

export async function getInsights(): Promise<Insight[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("ai_insights")
    .select("id, kind, title, amount, period, body, action_label, services")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true }) as { data: InsightRow[] | null; error: unknown };

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    amount: Number(row.amount),
    period: row.period,
    body: row.body,
    action: row.action_label,
    services: row.services || [],
  }));
}
