import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const url    = new URL(request.url);
  const code   = url.searchParams.get("code");
  const state  = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (oauthError) {
    console.warn("[gmail/callback] Google returned error:", oauthError);
    return NextResponse.redirect(`${appUrl}/gmail?error=access_denied`);
  }

  // CSRF check
  const storedState = request.cookies.get("gmail_oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    console.warn("[gmail/callback] State mismatch — possible CSRF");
    return NextResponse.redirect(`${appUrl}/gmail?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/gmail?error=no_code`);
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri  = `${appUrl}/api/auth/gmail/callback`;

  // ── Exchange authorization code for tokens ──────────────────────────────────
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    "authorization_code",
    }),
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[gmail/callback] Token exchange failed:", err);
    return NextResponse.redirect(`${appUrl}/gmail?error=token_exchange`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token:  string;
    refresh_token?: string;
    expires_in:    number;
    token_type:    string;
  };

  // ── Get the Gmail address from Google's userinfo endpoint ───────────────────
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    cache: "no-store",
  });

  const profile = profileRes.ok
    ? ((await profileRes.json()) as { email?: string })
    : null;

  const gmailEmail = profile?.email ?? user.email ?? "unknown@gmail.com";
  const expiresAt  = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  console.log(`[gmail/callback] OAuth success for ${gmailEmail} (user ${user.id})`);

  // ── Upsert gmail_connections ────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { error: upsertErr } = await db
    .from("gmail_connections")
    .upsert(
      {
        user_id:          user.id,
        email:            gmailEmail,
        access_token:     tokens.access_token,
        refresh_token:    tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        status:           "active",
        last_synced_at:   new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertErr) {
    console.error("[gmail/callback] DB upsert failed:", upsertErr);
    return NextResponse.redirect(`${appUrl}/gmail?error=db_error`);
  }

  // ── Clear state cookie and redirect ────────────────────────────────────────
  const response = NextResponse.redirect(`${appUrl}/gmail?connected=1`);
  response.cookies.set("gmail_oauth_state", "", { maxAge: 0, path: "/" });

  return response;
}
