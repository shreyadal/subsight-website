import { createAdminClient } from "@/lib/supabase/admin";
import type { TokenState } from "./types";

interface GmailRow {
  id: string;
  email: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  status: string;
}

// Exchanges a refresh token for a new access token via Google OAuth endpoint.
async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("[gmail/tokens] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — cannot refresh");
    return null;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[gmail/tokens] refresh failed:", err);
    return null;
  }

  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

// Returns a valid (possibly refreshed) token for the user, or null if not connected.
export async function getValidToken(userId: string): Promise<TokenState | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: row } = await db
    .from("gmail_connections")
    .select("id, email, access_token, refresh_token, token_expires_at, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle() as { data: GmailRow | null };

  if (!row || !row.access_token) return null;

  // Check if token is still valid (with 60s buffer)
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at) : null;
  const isExpired = !expiresAt || expiresAt.getTime() - 60_000 < Date.now();

  if (!isExpired) {
    return { token: row.access_token, gmailEmail: row.email, connectionId: row.id };
  }

  // Token expired — try to refresh
  if (!row.refresh_token) {
    await db
      .from("gmail_connections")
      .update({ status: "error" })
      .eq("id", row.id);
    return null;
  }

  const refreshed = await refreshAccessToken(row.refresh_token);
  if (!refreshed) {
    await db
      .from("gmail_connections")
      .update({ status: "error" })
      .eq("id", row.id);
    return null;
  }

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await db
    .from("gmail_connections")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiresAt,
      status: "active",
    })
    .eq("id", row.id);

  return {
    token: refreshed.access_token,
    gmailEmail: row.email,
    connectionId: row.id,
  };
}
