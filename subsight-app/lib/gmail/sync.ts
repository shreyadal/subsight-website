import { createAdminClient } from "@/lib/supabase/admin";
import { listMessageIds, getMessage, buildSearchQuery } from "./client";
import { parseBillingEmail } from "./parser";
import { getValidToken } from "./tokens";
import type { SyncResult } from "./types";

interface ConnectionMeta {
  last_synced_at: string;
  emails_scanned: number;
}

export async function syncGmail(userId: string): Promise<SyncResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  // ── 1. Get a valid token ───────────────────────────────────────────────────
  const tokenState = await getValidToken(userId);
  if (!tokenState) {
    throw new Error("Gmail not connected or token expired. Please reconnect.");
  }
  const { token, connectionId } = tokenState;

  // ── 2. Determine sync window (incremental after first run) ─────────────────
  const { data: conn } = await db
    .from("gmail_connections")
    .select("last_synced_at, emails_scanned")
    .eq("id", connectionId)
    .maybeSingle() as { data: ConnectionMeta | null };

  const lastSyncedAt = conn?.last_synced_at;
  // Use a slightly earlier cutoff so we don't miss emails at sync boundaries
  const afterSeconds = lastSyncedAt
    ? Math.floor((new Date(lastSyncedAt).getTime() - 5 * 60_000) / 1000)
    : 0;

  const query = buildSearchQuery(afterSeconds);

  // ── 3. Fetch message IDs from Gmail ────────────────────────────────────────
  let messageIds: string[];
  try {
    messageIds = await listMessageIds(token, query, 50);
  } catch (err) {
    if (String(err).includes("GMAIL_TOKEN_EXPIRED")) {
      await db
        .from("gmail_connections")
        .update({ status: "error" })
        .eq("id", connectionId);
    }
    throw err;
  }

  // ── 4. Process each message ────────────────────────────────────────────────
  let emailsScanned = 0;
  let subscriptionsFound = 0;
  let trialsDetected = 0;
  let newTransactions = 0;
  const errors: string[] = [];

  for (const msgId of messageIds) {
    try {
      // Skip if already processed (idempotency via gmail_email_log unique key)
      const { count } = await db
        .from("gmail_email_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("gmail_message_id", msgId) as { count: number | null };

      if ((count ?? 0) > 0) continue;

      const msg = await getMessage(token, msgId);
      const parsed = parseBillingEmail(msg);
      if (!parsed) continue;

      emailsScanned++;

      // ── 4a. Log the email ────────────────────────────────────────────────
      await db.from("gmail_email_log").insert({
        user_id: userId,
        gmail_message_id: parsed.messageId,
        from_address: parsed.from,
        subject: parsed.subject,
        merchant_name: parsed.merchantName,
        amount_inr: parsed.amountInr,
        email_date: parsed.date.toISOString().split("T")[0],
        tag: parsed.tag,
      });

      if (parsed.tag === "trial") trialsDetected++;
      subscriptionsFound++;

      // ── 4b. Insert transaction (if we have an amount) ────────────────────
      if (parsed.amountInr && parsed.amountInr > 0) {
        await db.from("transactions").insert({
          user_id: userId,
          merchant: parsed.merchantName,
          norm: parsed.merchantName,
          amount: parsed.amountInr,
          currency: "INR",
          type: "debit",
          category: parsed.category,
          account_label: "Gmail",
          recurring_confidence: 0.85,
          transacted_at: parsed.date.toISOString(),
        });
        newTransactions++;
      }

      // ── 4c. Upsert subscription (only if not already tracked) ────────────
      const { count: subCount } = await db
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("name", parsed.merchantName) as { count: number | null };

      if ((subCount ?? 0) === 0) {
        const nextRenewal = new Date(parsed.date);
        if (parsed.cycle === "mo") {
          nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        } else {
          nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        }

        await db.from("subscriptions").insert({
          user_id: userId,
          name: parsed.merchantName,
          plan: "",
          price: parsed.amountInr ?? 0,
          currency: "INR",
          cycle: parsed.cycle,
          category: parsed.category,
          status: "active",
          detected_by: "gmail",
          confidence: 0.9,
          source_label: "Gmail",
          renew_label: parsed.cycle === "mo" ? "Monthly" : "Yearly",
          next_renewal_date: nextRenewal.toISOString().split("T")[0],
          ai_tag: parsed.tag === "trial" ? "trial" : null,
          ai_insight:
            parsed.tag === "trial"
              ? `Trial detected via Gmail receipt — check conversion date`
              : `Detected via Gmail receipt`,
        });

        // Generate an ai_insight for trial emails
        if (parsed.tag === "trial" && parsed.amountInr) {
          await db.from("ai_insights").insert({
            user_id: userId,
            kind: "trial",
            title: `${parsed.merchantName} trial — check before it converts`,
            amount: parsed.amountInr,
            period: parsed.cycle,
            body: `A trial receipt was detected in your Gmail. It may convert to ₹${parsed.amountInr}/${parsed.cycle} soon. Review before the next billing cycle.`,
            action_label: "Review trial",
            services: [parsed.merchantName],
            status: "active",
          });
        }
      }
    } catch (err) {
      errors.push(`[${msgId}] ${String(err)}`);
    }
  }

  // ── 5. Update connection stats ─────────────────────────────────────────────
  await db
    .from("gmail_connections")
    .update({
      last_synced_at: new Date().toISOString(),
      emails_scanned: (conn?.emails_scanned ?? 0) + emailsScanned,
      subscriptions_detected: subscriptionsFound,
      trials_detected: trialsDetected,
      status: "active",
    })
    .eq("id", connectionId);

  return { emailsScanned, subscriptionsFound, trialsDetected, newTransactions, errors };
}
