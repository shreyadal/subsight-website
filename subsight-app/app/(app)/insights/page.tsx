import { getInsights } from "@/lib/db/insights";
import { getSubscriptions } from "@/lib/db/subscriptions";
import { INSIGHTS, SUBSCRIPTIONS } from "@/lib/mock-data";
import { InsightsClient } from "./insights-client";

export default async function InsightsPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const insights = hasSupabase ? await getInsights() : INSIGHTS;
  const subscriptions = hasSupabase ? await getSubscriptions() : SUBSCRIPTIONS;

  return <InsightsClient insights={insights} subscriptions={subscriptions} />;
}
