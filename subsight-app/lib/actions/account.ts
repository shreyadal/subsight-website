"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAccount() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Account deletion is not available in this environment." };
  }

  // Admin client bypasses RLS — deletes the auth.users row which cascades
  // to all user data: profiles, subscriptions, transactions, insights, etc.
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  // Clear the session cookie
  await supabase.auth.signOut();

  redirect("/");
}
