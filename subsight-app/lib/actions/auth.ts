"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

// ─── Email / password ─────────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  // Check onboarding completion to decide where to land
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: ob } = await supabase
      .from("onboarding_state")
      .select("completed")
      .eq("id", user.id)
      .maybeSingle() as { data: { completed: boolean } | null };
    if (!ob?.completed) redirect("/onboarding");
  }

  redirect("/overview");
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
) {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  redirect("/onboarding");
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?google=1`,
      scopes:
        "email profile https://www.googleapis.com/auth/gmail.readonly",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function resetPassword(email: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: true };
}

// ─── Onboarding state ─────────────────────────────────────────────────────────

export async function updateOnboardingState(updates: {
  step?: number;
  bank_connected?: boolean;
  gmail_connected?: boolean;
  source?: string;
  completed?: boolean;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("onboarding_state")
    .update({
      ...updates,
      ...(updates.completed
        ? { completed_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  if (updates.completed && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { seedDemoData } = await import("@/lib/db/seed");
    await seedDemoData(user.id);
  }

  return { success: true };
}
