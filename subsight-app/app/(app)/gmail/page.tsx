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
  confidence: number | null;
  detected_by: string | null;
}

const MOCK_STATS = {
  gmailEmail: "demo@example.com",
  emailsScanned: 0,
  subscriptionsFound: 0,
  trialsDetected: 0,
  lastSyncedAt: new Date().toISOString(),
  isConnected: false,
  isSyncing: false,
};

export default async function GmailPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!hasSupabase) {
    return <GmailPageClient stats={MOCK_STATS} matches={[]} />;
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

  const { data: conn } = (await db
    .from("gmail_connections")
    .select("email, status, emails_scanned, subscriptions_detected, trials_detected, last_synced_at")
    .eq("user_id", user.id)
    .maybeSingle()) as { data: ConnectionRow | null };

  // Fetch email log including new debug columns
  const { data: emailLog, error: logError } = (await db
    .from("gmail_email_log")
    .select("from_address, subject, merchant_name, amount_inr, tag, email_date, confidence, detected_by")
    .eq("user_id", user.id)
    .order("email_date", { ascending: false })
    .limit(50)) as { data: EmailLogRow[] | null; error: unknown };

  if (logError) {
    console.error("[gmail:page] Error fetching email log:", logError);
  }

  const isConnected = conn?.status === "active" || conn?.status === "syncing";
  const isSyncing = conn?.status === "syncing";

  const stats = conn
    ? {
        gmailEmail: conn.email,
        emailsScanned: conn.emails_scanned ?? 0,
        subscriptionsFound: conn.subscriptions_detected ?? 0,
        trialsDetected: conn.trials_detected ?? 0,
        lastSyncedAt: conn.last_synced_at ?? new Date().toISOString(),
        isConnected,
        isSyncing,
      }
    : {
        gmailEmail: user.email ?? "",
        emailsScanned: 0,
        subscriptionsFound: 0,
        trialsDetected: 0,
        lastSyncedAt: new Date().toISOString(),
        isConnected: false,
        isSyncing: false,
      };

  const matches = (emailLog ?? []).map((row) => ({
    fromAddress: row.from_address,
    subject: row.subject,
    merchantName: row.merchant_name,
    amountInr: row.amount_inr,
    tag: row.tag,
    emailDate: row.email_date,
    confidence: row.confidence,
    detectedBy: row.detected_by,
  }));

  return <GmailPageClient stats={stats} matches={matches} />;
}
