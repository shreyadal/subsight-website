"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  login_method: string;
  currency: string;
  timezone: string;
}

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
}

export function useProfile(): ProfileState {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
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
      .from("profiles")
      .select("id, email, full_name, avatar_url, login_method, currency, timezone")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: Profile | null }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user, authLoading]);

  return { profile, loading };
}
