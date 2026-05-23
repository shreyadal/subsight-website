import { createServerClient } from "@/lib/supabase/server";
import type { Subscription, Renewal } from "@/lib/mock-data";

type SubRow = {
  id: string;
  name: string;
  plan: string;
  price: number;
  cycle: "mo" | "yr";
  status: string;
  renew_label: string;
  source_label: string;
  category: string;
  confidence: number;
  ai_insight: string | null;
  ai_tag: string | null;
  next_renewal_date: string | null;
};

export async function getSubscriptions(): Promise<Subscription[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .select("id, name, plan, price, cycle, status, renew_label, source_label, category, confidence, ai_insight, ai_tag, next_renewal_date")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true }) as { data: SubRow[] | null; error: unknown };

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    plan: row.plan,
    price: Number(row.price),
    cycle: row.cycle,
    renew: row.status === "paused" ? "paused" : (row.renew_label || "—"),
    source: row.source_label,
    cat: row.category,
    conf: Number(row.confidence),
    active: row.status === "active",
    insight: row.ai_insight,
    tag: row.ai_tag,
  }));
}

type RenewalRow = {
  id: string;
  name: string;
  next_renewal_date: string;
  renew_label: string;
  price: number;
};

export async function getRenewals(): Promise<Renewal[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() + 30);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscriptions")
    .select("id, name, next_renewal_date, renew_label, price")
    .eq("user_id", user.id)
    .eq("status", "active")
    .not("next_renewal_date", "is", null)
    .lte("next_renewal_date", cutoff.toISOString().split("T")[0])
    .order("next_renewal_date", { ascending: true })
    .limit(5) as { data: RenewalRow[] | null; error: unknown };

  if (error || !data) return [];

  return data.map((row) => {
    const renewDate = new Date(row.next_renewal_date + "T00:00:00");
    const diffDays = Math.ceil((renewDate.getTime() - today.getTime()) / 86_400_000);
    const inLabel = diffDays <= 0 ? "today" : diffDays === 1 ? "1 day" : `${diffDays} days`;
    return {
      id: row.id,
      name: row.name,
      in: inLabel,
      date: row.renew_label || "—",
      price: Number(row.price),
    };
  });
}
