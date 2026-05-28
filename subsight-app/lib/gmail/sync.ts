import { createAdminClient } from "@/lib/supabase/admin";
import {
  listMessageIds,
  getMessage,
  getMessageFull,
  extractTextFromMessage,
  buildSearchQuery,
} from "./client";
import { parseBillingEmail } from "./parser";
import { isPaymentProcessor } from "./merchants";
import { getValidToken } from "./tokens";
import { clearAiCache } from "./normalizer";
import type { SyncResult } from "./types";

// How long before a 'syncing' status is considered stale (stuck job)
const SYNC_STALE_MS = 5 * 60_000;

interface ConnectionMeta {
  last_synced_at: string | null;
  last_sync_started_at: string | null;
  emails_scanned: number;
  status: string;
  ai_calls_made: number;
}

// ─── Sync orchestrator ────────────────────────────────────────────────────────

export async function syncGmail(userId: string): Promise<SyncResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  console.log(`[gmail:sync] ── Starting Gmail sync for user ${userId} ──`);

  // Clear per-run AI cache to avoid stale hits across sync runs
  clearAiCache();

  // ── 1. Get a valid token ────────────────────────────────────────────────────
  const tokenState = await getValidToken(userId);
  if (!tokenState) {
    console.warn(`[gmail:sync] ✗ No valid token for user ${userId} — reconnect required`);
    throw new Error("Gmail not connected or token expired. Please reconnect.");
  }
  const { token, connectionId, gmailEmail } = tokenState;
  console.log(`[gmail:sync] ✓ Token valid for ${gmailEmail} (connection ${connectionId})`);

  // ── 2. Load connection metadata ─────────────────────────────────────────────
  const { data: conn } = (await db
    .from("gmail_connections")
    .select("last_synced_at, last_sync_started_at, emails_scanned, status, ai_calls_made")
    .eq("id", connectionId)
    .maybeSingle()) as { data: ConnectionMeta | null };

  // ── 3. Guard against concurrent syncs ──────────────────────────────────────
  if (conn?.status === "syncing") {
    const startedAt = conn.last_sync_started_at
      ? new Date(conn.last_sync_started_at).getTime()
      : 0;
    const isStuck = Date.now() - startedAt > SYNC_STALE_MS;
    if (!isStuck) {
      console.warn(`[gmail:sync] ✗ Sync already in progress — rejecting concurrent request`);
      throw new Error("ALREADY_SYNCING");
    }
    console.warn(`[gmail:sync] ⚠ Stale 'syncing' lock detected (started ${Math.round((Date.now() - startedAt) / 60000)}m ago) — proceeding`);
  }

  // ── 4. Mark as syncing ──────────────────────────────────────────────────────
  await db
    .from("gmail_connections")
    .update({ status: "syncing", last_sync_started_at: new Date().toISOString() })
    .eq("id", connectionId);

  // ── 4.5. Delete demo/seed rows before inserting real Gmail data ─────────────
  // Rows seeded by seedDemoData() carry is_demo = true. We wipe them now so
  // real Gmail-derived rows are never mixed with fictional demo data.
  const { error: demoSubErr } = await db
    .from("subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("is_demo", true);
  const { error: demoTxErr } = await db
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .eq("is_demo", true);
  const { error: demoInsightErr } = await db
    .from("ai_insights")
    .delete()
    .eq("user_id", userId)
    .eq("is_demo", true);

  if (demoSubErr || demoTxErr || demoInsightErr) {
    console.warn(`[gmail:sync] ⚠ Demo cleanup errors — sub:${demoSubErr} tx:${demoTxErr} insight:${demoInsightErr}`);
  } else {
    console.log(`[gmail:sync] 🗑 Demo rows cleared (subscriptions + transactions + ai_insights) for user ${userId}`);
  }

  // ── 5. Determine incremental sync window ────────────────────────────────────
  const lastSyncedAt = conn?.last_synced_at;
  const afterSeconds = lastSyncedAt
    ? Math.floor((new Date(lastSyncedAt).getTime() - 5 * 60_000) / 1000)
    : 0;

  const windowDesc = lastSyncedAt
    ? `incremental (after ${new Date(lastSyncedAt).toISOString()})`
    : "full 180-day lookback";
  console.log(`[gmail:sync] Sync window: ${windowDesc}`);

  const query = buildSearchQuery(afterSeconds);

  // ── 6. Fetch Gmail message IDs ───────────────────────────────────────────────
  let messageIds: string[];
  try {
    messageIds = await listMessageIds(token, query, 200);
    console.log(`[gmail:sync] Fetched ${messageIds.length} message IDs from Gmail`);
  } catch (err) {
    const msg = String(err);
    if (msg.includes("GMAIL_TOKEN_EXPIRED")) {
      console.error(`[gmail:sync] ✗ Token expired mid-sync — marking connection as error`);
      await db
        .from("gmail_connections")
        .update({ status: "error" })
        .eq("id", connectionId);
    }
    throw err;
  }

  if (messageIds.length === 0) {
    console.log(`[gmail:sync] No new messages matched billing query — marking sync complete`);
    await db
      .from("gmail_connections")
      .update({ status: "active", last_synced_at: new Date().toISOString() })
      .eq("id", connectionId);
    return { emailsScanned: 0, subscriptionsFound: 0, trialsDetected: 0, newTransactions: 0, aiCallsMade: 0, errors: [] };
  }

  // ── 7. Process each message ──────────────────────────────────────────────────
  let emailsScanned = 0;
  let subscriptionsFound = 0;
  let trialsDetected = 0;
  let newTransactions = 0;
  let aiCallsMade = 0;
  const errors: string[] = [];

  for (const msgId of messageIds) {
    try {
      // Check idempotency via unique constraint on (user_id, gmail_message_id)
      const { count } = (await db
        .from("gmail_email_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("gmail_message_id", msgId)) as { count: number | null };

      if ((count ?? 0) > 0) {
        console.log(`[gmail:sync] ↩ Skip ${msgId} — already in email log`);
        continue;
      }

      // ── 7a. Fetch metadata ───────────────────────────────────────────────
      const msg = await getMessage(token, msgId);
      const from = extractHeader(msg, "From");
      const subject = extractHeader(msg, "Subject");
      const snippet = msg.snippet ?? "";

      console.log(`[gmail:sync] Processing ${msgId}`);
      console.log(`[gmail:sync]   From:    ${from}`);
      console.log(`[gmail:sync]   Subject: ${subject}`);
      console.log(`[gmail:sync]   Snippet: ${snippet.slice(0, 80)}`);

      // ── 7b. Fetch full body for payment processors ───────────────────────
      let bodyText: string | undefined;
      if (isPaymentProcessor(from)) {
        console.log(`[gmail:sync]   Payment processor detected — fetching full body`);
        try {
          const full = await getMessageFull(token, msgId);
          bodyText = extractTextFromMessage(full);
          console.log(`[gmail:sync]   Body excerpt: ${bodyText.slice(0, 100)}`);
        } catch (bodyErr) {
          console.warn(`[gmail:sync]   ⚠ Could not fetch full body: ${String(bodyErr)}`);
        }
      }

      // ── 7c. Parse through the 4-layer pipeline ───────────────────────────
      const parsed = await parseBillingEmail(msg, bodyText);

      if (!parsed) {
        console.log(`[gmail:sync]   ✗ Parser returned null — no merchant match across all 4 layers`);
        continue;
      }

      console.log(`[gmail:sync]   ✓ Parsed → merchant="${parsed.merchantName}" amount=${parsed.amountInr != null ? `₹${parsed.amountInr}` : "N/A"} tag=${parsed.tag} confidence=${(parsed.confidence * 100).toFixed(0)}% via=${parsed.detectedBy}`);

      if (parsed.detectedBy === "ai") {
        aiCallsMade++;
        console.log(`[gmail:sync]   ← AI inference used (total this run: ${aiCallsMade})`);
      }

      emailsScanned++;

      // ── 7d. Log the email ────────────────────────────────────────────────
      await db.from("gmail_email_log").insert({
        user_id: userId,
        gmail_message_id: parsed.messageId,
        from_address: parsed.from,
        subject: parsed.subject,
        merchant_name: parsed.merchantName,
        amount_inr: parsed.amountInr,
        email_date: parsed.date.toISOString().split("T")[0],
        tag: parsed.tag,
        confidence: parsed.confidence,
        detected_by: parsed.detectedBy,
      });
      console.log(`[gmail:sync]   ✓ Email logged — merchant="${parsed.merchantName}" amount=${parsed.amountInr != null ? `₹${parsed.amountInr}` : "—"} via=${parsed.detectedBy} conf=${(parsed.confidence * 100).toFixed(0)}%`);

      if (parsed.tag === "trial") trialsDetected++;
      subscriptionsFound++;

      // ── 7e. Insert transaction (deduplicated) ────────────────────────────
      if (parsed.amountInr && parsed.amountInr > 0) {
        const txExists = await transactionExists(db, userId, parsed.merchantName, parsed.amountInr, parsed.date);

        if (txExists) {
          console.log(`[gmail:sync]   ↩ Duplicate transaction skipped — ${parsed.merchantName} ₹${parsed.amountInr} already exists within ±2 days`);
        } else {
          await db.from("transactions").insert({
            user_id: userId,
            is_demo: false,
            merchant: parsed.merchantName,
            norm: parsed.merchantName,
            amount: parsed.amountInr,
            currency: "INR",
            type: "debit",
            category: parsed.category,
            account_label: "Gmail",
            recurring_confidence: parsed.confidence,
            transacted_at: parsed.date.toISOString(),
          });
          newTransactions++;
          console.log(`[gmail:sync]   ✓ Inserted real transaction: ${parsed.merchantName} ₹${parsed.amountInr}`);
        }
      } else {
        console.log(`[gmail:sync]   ↩ No amount extracted — transaction skipped`);
      }

      // ── 7f. Upsert subscription (case-insensitive dedup) ─────────────────
      const subExists = await subscriptionExists(db, userId, parsed.merchantName);
      if (subExists) {
        console.log(`[gmail:sync]   ↩ Duplicate subscription skipped — "${parsed.merchantName}" already in subscriptions table`);
      } else {
        const nextRenewal = new Date(parsed.date);
        if (parsed.cycle === "mo") {
          nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        } else {
          nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        }

        await db.from("subscriptions").insert({
          user_id: userId,
          is_demo: false,
          name: parsed.merchantName,
          plan: "",
          price: parsed.amountInr ?? 0,
          currency: "INR",
          cycle: parsed.cycle,
          category: parsed.category,
          status: "active",
          detected_by: "gmail",
          confidence: parsed.confidence,
          source_label: "Gmail",
          renew_label: parsed.cycle === "mo" ? "Monthly" : "Yearly",
          next_renewal_date: nextRenewal.toISOString().split("T")[0],
          ai_tag: parsed.tag === "trial" ? "trial" : null,
          ai_insight:
            parsed.tag === "trial"
              ? `Trial detected via Gmail — verify conversion date`
              : parsed.detectedBy === "ai"
              ? `Detected via Gmail (AI-normalised receipt)`
              : `Detected via Gmail receipt`,
        });
        console.log(`[gmail:sync]   ✓ Inserted real subscription: "${parsed.merchantName}" ₹${parsed.amountInr ?? 0}/${parsed.cycle} via=${parsed.detectedBy}`);

        // Generate ai_insight for trial notifications
        if (parsed.tag === "trial" && parsed.amountInr) {
          await db.from("ai_insights").insert({
            user_id: userId,
            is_demo: false,
            kind: "trial",
            title: `${parsed.merchantName} trial — review before it converts`,
            amount: parsed.amountInr,
            period: parsed.cycle,
            body: `A trial receipt was detected in your Gmail. It may convert to ₹${parsed.amountInr.toLocaleString("en-IN")}/${parsed.cycle} soon.`,
            action_label: "Review trial",
            services: [parsed.merchantName],
            status: "active",
          });
          console.log(`[gmail:sync]   ✓ Inserted real ai_insight (trial): ${parsed.merchantName}`);
        }
      }
    } catch (err) {
      const errMsg = `[${msgId}] ${String(err)}`;
      console.error(`[gmail:sync] ✗ Error processing message: ${errMsg}`);
      errors.push(errMsg);
    }
  }

  // ── 8. Update connection stats and clear syncing flag ───────────────────────
  const totalAiCalls = (conn?.ai_calls_made ?? 0) + aiCallsMade;
  await db
    .from("gmail_connections")
    .update({
      status: "active",
      last_synced_at: new Date().toISOString(),
      emails_scanned: (conn?.emails_scanned ?? 0) + emailsScanned,
      subscriptions_detected: subscriptionsFound,
      trials_detected: trialsDetected,
      ai_calls_made: totalAiCalls,
    })
    .eq("id", connectionId);

  console.log(`[gmail:sync] ── Sync complete ──`);
  console.log(`[gmail:sync]   Emails scanned:      ${emailsScanned}`);
  console.log(`[gmail:sync]   Subscriptions found: ${subscriptionsFound}`);
  console.log(`[gmail:sync]   Trials detected:     ${trialsDetected}`);
  console.log(`[gmail:sync]   New transactions:    ${newTransactions}`);
  console.log(`[gmail:sync]   AI calls made:       ${aiCallsMade}`);
  if (errors.length > 0) {
    console.warn(`[gmail:sync]   Errors (${errors.length}):`);
    errors.forEach((e) => console.warn(`[gmail:sync]     ${e}`));
  }

  return { emailsScanned, subscriptionsFound, trialsDetected, newTransactions, aiCallsMade, errors };
}

// ─── Deduplication helpers ────────────────────────────────────────────────────

async function subscriptionExists(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string,
  merchantName: string
): Promise<boolean> {
  const { count } = (await db
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .ilike("name", merchantName)) as { count: number | null };
  return (count ?? 0) > 0;
}

async function transactionExists(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string,
  merchantName: string,
  amount: number,
  date: Date
): Promise<boolean> {
  const lower = new Date(date);
  lower.setDate(lower.getDate() - 2);
  const upper = new Date(date);
  upper.setDate(upper.getDate() + 2);

  const { count } = (await db
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .ilike("merchant", merchantName)
    .eq("amount", amount)
    .gte("transacted_at", lower.toISOString())
    .lte("transacted_at", upper.toISOString())) as { count: number | null };
  return (count ?? 0) > 0;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function extractHeader(
  msg: { payload: { headers: Array<{ name: string; value: string }> } },
  name: string
): string {
  return (
    msg.payload?.headers?.find(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    )?.value ?? ""
  );
}
