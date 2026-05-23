import { createServerClient } from "@/lib/supabase/server";
import { GmailPageClient } from "./gmail-client";

interface ConnectionRow {
  email: string;
  status: string;
  emails_scanned: number;
  subscriptions_detected: number;
  trials_detected: number;
  last_synced_at: string;
}

interface EmailLogRow {
  from_address: string;
  subject: string;
  merchant_name: string;
  amount_inr: number | null;
  tag: string;
  email_date: string;
}

const MOCK_STATS = {
  gmailEmail: "aanya@acme.in",
  emailsScanned: 2841,
  subscriptionsFound: 11,
  trialsDetected: 2,
  lastSyncedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
  isConnected: true,
};

const MOCK_MATCHES = [
  { fromAddress: "billing@netflix.com",  subject: "Your Netflix subscription receipt — May 2026",     merchantName: "Netflix",    amountInr: 649,  tag: "subscription", emailDate: new Date(Date.now() - 1 * 86400000).toISOString() },
  { fromAddress: "no-reply@adobe.com",   subject: "Adobe Creative Cloud — Invoice #INV-20260502",      merchantName: "Adobe",      amountInr: 4719, tag: "invoice",      emailDate: new Date(Date.now() - 4 * 86400000).toISOString() },
  { fromAddress: "trial@midjourney.com", subject: "Your Midjourney trial ends in 2 days",              merchantName: "Midjourney", amountInr: 830,  tag: "trial",        emailDate: new Date(Date.now() - 5 * 86400000).toISOString() },
  { fromAddress: "billing@spotify.com",  subject: "Spotify Family — receipt for May 2026",             merchantName: "Spotify",    amountInr: 179,  tag: "subscription", emailDate: new Date(Date.now() - 6 * 86400000).toISOString() },
  { fromAddress: "receipts@canva.com",   subject: "Canva Pro · Workspace invoice",                     merchantName: "Canva",      amountInr: 499,  tag: "invoice",      emailDate: new Date(Date.now() - 8 * 86400000).toISOString() },
];

export default async function GmailPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!hasSupabase) {
    return <GmailPageClient stats={MOCK_STATS} matches={MOCK_MATCHES} />;
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <GmailPageClient stats={{ ...MOCK_STATS, isConnected: false }} matches={[]} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: conn } = await db
    .from("gmail_connections")
    .select("email, status, emails_scanned, subscriptions_detected, trials_detected, last_synced_at")
    .eq("user_id", user.id)
    .maybeSingle() as { data: ConnectionRow | null };

  const { data: emailLog } = await db
    .from("gmail_email_log")
    .select("from_address, subject, merchant_name, amount_inr, tag, email_date")
    .eq("user_id", user.id)
    .order("email_date", { ascending: false })
    .limit(50) as { data: EmailLogRow[] | null };

  const stats = conn
    ? {
        gmailEmail: conn.email,
        emailsScanned: conn.emails_scanned,
        subscriptionsFound: conn.subscriptions_detected,
        trialsDetected: conn.trials_detected,
        lastSyncedAt: conn.last_synced_at,
        isConnected: conn.status === "active",
      }
    : { gmailEmail: user.email ?? "", emailsScanned: 0, subscriptionsFound: 0, trialsDetected: 0, lastSyncedAt: new Date().toISOString(), isConnected: false };

  const matches = (emailLog ?? []).map((row) => ({
    fromAddress: row.from_address,
    subject: row.subject,
    merchantName: row.merchant_name,
    amountInr: row.amount_inr,
    tag: row.tag,
    emailDate: row.email_date,
  }));

  return <GmailPageClient stats={stats} matches={matches} />;
}
