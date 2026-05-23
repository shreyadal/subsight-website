import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const isGoogle = searchParams.get("google") === "1";

  if (code) {
    const supabase = await createServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      const user = session.user;

      // ── Capture Gmail OAuth tokens ────────────────────────────────────────
      // provider_token is the Google access token; provider_refresh_token is
      // the refresh token (only present when access_type=offline + prompt=consent).
      if (isGoogle && session.provider_token && user && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const googleEmail =
            user.user_metadata?.email ?? user.email ?? "";

          // Token expires in ~3600s; store with a 5-min buffer
          const expiresAt = new Date(Date.now() + 3595 * 1000).toISOString();

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const admin = createAdminClient() as any;
          await admin.from("gmail_connections").upsert(
            {
              user_id: user.id,
              email: googleEmail,
              access_token: session.provider_token,
              refresh_token: session.provider_refresh_token ?? null,
              token_expires_at: expiresAt,
              status: "active",
              last_synced_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch (tokenErr) {
          // Non-fatal — user can still proceed; sync will surface the error
          console.error("[auth/callback] Failed to store Gmail tokens:", tokenErr);
        }
      }

      // ── Onboarding redirect logic ─────────────────────────────────────────
      if (user) {
        const { data: ob } = await supabase
          .from("onboarding_state")
          .select("completed")
          .eq("id", user.id)
          .maybeSingle() as { data: { completed: boolean } | null };

        if (!ob?.completed) {
          const googleParam = isGoogle ? "?google=1" : "";
          return NextResponse.redirect(`${origin}/onboarding${googleParam}`);
        }
      }

      return NextResponse.redirect(`${origin}/overview`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
