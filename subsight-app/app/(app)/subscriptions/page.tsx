import { getSubscriptions, getRenewals } from "@/lib/db/subscriptions";
import { getInsights } from "@/lib/db/insights";
import { SUBSCRIPTIONS, RENEWALS, INSIGHTS } from "@/lib/mock-data";
import { SubscriptionsClient } from "./subscriptions-client";

export default async function SubscriptionsPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const subscriptions = hasSupabase ? await getSubscriptions() : SUBSCRIPTIONS;
  const renewals = hasSupabase ? await getRenewals() : RENEWALS;
  const insights = hasSupabase ? await getInsights() : INSIGHTS;

  return <SubscriptionsClient subscriptions={subscriptions} renewals={renewals} insights={insights} />;
}
