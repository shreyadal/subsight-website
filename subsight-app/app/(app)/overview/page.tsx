import { getSubscriptions, getRenewals } from "@/lib/db/subscriptions";
import { createServerClient } from "@/lib/supabase/server";
import { SUBSCRIPTIONS, RENEWALS } from "@/lib/mock-data";
import { OverviewClient } from "./overview-client";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstName(fullName: string | null | undefined, email: string | null | undefined): string {
  if (fullName) return fullName.split(" ")[0];
  if (email) return email.split("@")[0];
  return "there";
}

export default async function OverviewPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const subscriptions = hasSupabase ? await getSubscriptions() : SUBSCRIPTIONS;
  const renewals = hasSupabase ? await getRenewals() : RENEWALS;

  let firstName = "Aanya";
  if (hasSupabase) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    firstName = getFirstName(
      user?.user_metadata?.full_name,
      user?.email
    );
  }

  return (
    <OverviewClient
      subscriptions={subscriptions}
      renewals={renewals}
      greeting={`${getGreeting()}, ${firstName}`}
    />
  );
}
