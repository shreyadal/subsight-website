"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export interface OnboardingState {
  id: string;
  completed: boolean;
  step: number;
  bank_connected: boolean;
  gmail_connected: boolean;
  has_connected_bank: boolean;
  has_uploaded_statement: boolean;
  has_connected_gmail: boolean;
  onboarding_completed: boolean;
  source: string | null;
  completed_at: string | null;
}

interface OnboardingHookState {
  onboarding: OnboardingState | null;
  loading: boolean;
  isComplete: boolean;
}

export function useOnboarding(): OnboardingHookState {
  const { user, loading: authLoading } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("onboarding_state")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: OnboardingState | null }) => {
        setOnboarding(data);
        setLoading(false);
      });

    // Realtime: reflect DB state immediately in the onboarding UI
    const channel = supabase.channel(`onboarding_state:${user.id}`);
    channel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on("postgres_changes" as any, {
        event: "UPDATE",
        schema: "public",
        table: "onboarding_state",
        filter: `id=eq.${user.id}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (payload: any) => {
        setOnboarding(payload.new as OnboardingState);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  return {
    onboarding,
    loading,
    isComplete: onboarding?.completed ?? false,
  };
}
