import { createAdminClient } from "@/lib/supabase/admin";

type BankInserted = { id: string; bank_name: string; account_number_last4: string };
type SubInserted = { id: string; name: string };

// Seeds demo data for a newly onboarded user using the service role client.
// Called once on onboarding completion — idempotent.
//
// Seeding is SKIPPED when the user has an active Gmail connection.
// In that case, real subscription data flows in from Gmail sync instead,
// and demo rows would appear alongside (and conflict with) real data.
//
// All rows written here carry is_demo = true so that Gmail sync can
// bulk-delete them (DELETE WHERE is_demo = true) before inserting real data.
export async function seedDemoData(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  // Skip if already seeded (idempotency guard)
  const { count } = await db
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) > 0) {
    console.log(`[seed] Skipping — subscriptions already exist for user ${userId}`);
    return;
  }

  // Skip if Gmail is connected — real data will come from Gmail sync.
  // We check gmail_connections rather than onboarding_state.has_connected_gmail
  // because Google-OAuth sign-ins store the token before onboarding completes.
  const { count: gmailCount } = await db
    .from("gmail_connections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");
  if ((gmailCount ?? 0) > 0) {
    console.log(`[seed] Skipping demo seed for ${userId} — active Gmail connection found. Real data will come from Gmail sync.`);
    return;
  }

  console.log(`[seed] Seeding demo data (is_demo=true) for user ${userId}`);

  // ── 1. Bank connections ──────────────────────────────────────────────────────

  const { data: banks, error: banksError } = await db
    .from("bank_connections")
    .insert([
      {
        user_id: userId,
        bank_name: "HDFC Bank",
        account_number_last4: "4421",
        account_type: "savings",
        kind: "Savings · Primary",
        status: "live",
        color: "oklch(0.30 0.10 250)",
        last_synced_at: new Date(Date.now() - 2 * 60_000).toISOString(),
      },
      {
        user_id: userId,
        bank_name: "ICICI Bank",
        account_number_last4: "8810",
        account_type: "savings",
        kind: "Savings",
        status: "live",
        color: "oklch(0.30 0.10 25)",
        last_synced_at: new Date(Date.now() - 8 * 60_000).toISOString(),
      },
      {
        user_id: userId,
        bank_name: "Axis Bank",
        account_number_last4: "1102",
        account_type: "credit",
        kind: "Credit Card",
        status: "live",
        color: "oklch(0.30 0.10 350)",
        last_synced_at: new Date(Date.now() - 60 * 60_000).toISOString(),
      },
      {
        user_id: userId,
        bank_name: "Kotak",
        account_number_last4: "7720",
        account_type: "savings",
        kind: "Savings",
        status: "reconnect",
        color: "oklch(0.28 0.08 25)",
        last_synced_at: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
      },
    ])
    .select("id, bank_name, account_number_last4") as { data: BankInserted[] | null; error: unknown };

  if (banksError || !banks) return;

  const hdfc = banks.find((b) => b.bank_name === "HDFC Bank")!;
  const icici = banks.find((b) => b.bank_name === "ICICI Bank")!;
  const axis = banks.find((b) => b.bank_name === "Axis Bank")!;

  const hdfcLabel = `HDFC •• ${hdfc.account_number_last4}`;
  const icicILabel = `ICICI •• ${icici.account_number_last4}`;
  const axisLabel = `Axis •• ${axis.account_number_last4}`;

  // ── 2. Subscriptions ─────────────────────────────────────────────────────────

  const { data: subs, error: subsError } = await db
    .from("subscriptions")
    .insert([
      { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, name: "Netflix", plan: "Premium 4K", price: 649, cycle: "mo", category: "Streaming", status: "active", detected_by: "bank", confidence: 0.99, next_renewal_date: "2026-05-28", renew_label: "May 28", source_label: hdfcLabel, ai_tag: null, ai_insight: "Stable charge. No price change in 8 cycles." },
      { user_id: userId, is_demo: true, bank_connection_id: icici.id, name: "Adobe", plan: "Creative Cloud", price: 4719, cycle: "mo", category: "Software", status: "active", detected_by: "bank", confidence: 0.97, next_renewal_date: "2026-06-02", renew_label: "Jun 02", source_label: icicILabel, ai_tag: "overspend", ai_insight: "Potential overspending — switch to Photography plan saves ₹3,420/mo." },
      { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, name: "Spotify", plan: "Family", price: 179, cycle: "mo", category: "Music", status: "active", detected_by: "bank", confidence: 1.0, next_renewal_date: "2026-05-25", renew_label: "May 25", source_label: hdfcLabel, ai_tag: "renew-soon", ai_insight: "Renews in 3 days. Family plan unused by 2 of 6 members." },
      { user_id: userId, is_demo: true, bank_connection_id: axis.id, name: "Canva", plan: "Pro · Workspace #2", price: 499, cycle: "mo", category: "Software", status: "active", detected_by: "bank", confidence: 0.86, next_renewal_date: "2026-06-11", renew_label: "Jun 11", source_label: axisLabel, ai_tag: "duplicate", ai_insight: "Duplicate workspace — you already pay for Canva Teams on HDFC." },
      { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, name: "ChatGPT", plan: "Plus", price: 1999, cycle: "mo", category: "AI", status: "active", detected_by: "bank", confidence: 0.98, next_renewal_date: "2026-06-04", renew_label: "Jun 04", source_label: hdfcLabel, ai_tag: "overlap", ai_insight: "Overlaps with Claude Pro on this account. Consider consolidating." },
      { user_id: userId, is_demo: true, bank_connection_id: icici.id, name: "Claude", plan: "Pro", price: 1700, cycle: "mo", category: "AI", status: "active", detected_by: "bank", confidence: 0.95, next_renewal_date: "2026-06-09", renew_label: "Jun 09", source_label: icicILabel, ai_tag: null, ai_insight: "Used 142 hrs last month — your highest-value AI subscription." },
      { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, name: "Notion", plan: "Plus", price: 830, cycle: "mo", category: "Productivity", status: "active", detected_by: "bank", confidence: 0.99, next_renewal_date: "2026-06-14", renew_label: "Jun 14", source_label: hdfcLabel, ai_tag: "underused", ai_insight: "Underused — last active 38 days ago." },
      { user_id: userId, is_demo: true, bank_connection_id: axis.id, name: "Figma", plan: "Professional", price: 1245, cycle: "mo", category: "Software", status: "active", detected_by: "bank", confidence: 1.0, next_renewal_date: "2026-06-18", renew_label: "Jun 18", source_label: axisLabel, ai_tag: "yearly-save", ai_insight: "Heavy use detected. Yearly plan would save ₹3,140." },
      { user_id: userId, is_demo: true, bank_connection_id: icici.id, name: "Linear", plan: "Standard", price: 680, cycle: "mo", category: "Productivity", status: "active", detected_by: "bank", confidence: 0.92, next_renewal_date: "2026-06-21", renew_label: "Jun 21", source_label: icicILabel, ai_tag: null, ai_insight: null },
      { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, name: "Midjourney", plan: "Standard", price: 830, cycle: "mo", category: "AI", status: "active", detected_by: "gmail", confidence: 0.88, next_renewal_date: "2026-07-01", renew_label: "Jul 01", source_label: hdfcLabel, ai_tag: "trial", ai_insight: "Free trial ends in 2 days — auto-renew on." },
      { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, name: "iCloud", plan: "200 GB", price: 75, cycle: "mo", category: "Storage", status: "active", detected_by: "bank", confidence: 1.0, next_renewal_date: "2026-05-31", renew_label: "May 31", source_label: hdfcLabel, ai_tag: null, ai_insight: null },
      { user_id: userId, is_demo: true, bank_connection_id: axis.id, name: "YouTube", plan: "Premium Family", price: 189, cycle: "mo", category: "Streaming", status: "active", detected_by: "bank", confidence: 0.99, next_renewal_date: "2026-06-07", renew_label: "Jun 07", source_label: axisLabel, ai_tag: null, ai_insight: null },
      { user_id: userId, is_demo: true, bank_connection_id: icici.id, name: "Hotstar", plan: "Super", price: 299, cycle: "mo", category: "Streaming", status: "paused", detected_by: "bank", confidence: 0.81, next_renewal_date: null, renew_label: "paused", source_label: icicILabel, ai_tag: null, ai_insight: "Paused last cycle. Auto-detected." },
      { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, name: "GitHub", plan: "Copilot · Business", price: 1670, cycle: "mo", category: "Developer", status: "active", detected_by: "bank", confidence: 0.97, next_renewal_date: "2026-06-22", renew_label: "Jun 22", source_label: hdfcLabel, ai_tag: null, ai_insight: null },
      { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, name: "Cursor", plan: "Pro", price: 1670, cycle: "mo", category: "Developer", status: "active", detected_by: "bank", confidence: 0.94, next_renewal_date: "2026-06-17", renew_label: "Jun 17", source_label: hdfcLabel, ai_tag: "overlap", ai_insight: "Heavy overlap with Copilot — consider one." },
    ])
    .select("id, name") as { data: SubInserted[] | null; error: unknown };

  if (subsError || !subs) return;

  const subId = (name: string) => subs.find((s) => s.name === name)?.id ?? null;

  // ── 3. Transactions ──────────────────────────────────────────────────────────

  const baseDate = new Date("2026-05-22T00:00:00Z");
  const dayMs = 86_400_000;

  await db.from("transactions").insert([
    { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, subscription_id: subId("Netflix"), merchant: "NETFLIX.COM", norm: "Netflix", amount: 649, category: "Streaming", account_label: hdfcLabel, recurring_confidence: 0.99, transacted_at: new Date(baseDate.getTime() - 0 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, subscription_id: null, merchant: "SWIGGY", norm: "Swiggy", amount: 540, category: "Food", account_label: hdfcLabel, recurring_confidence: 0.04, transacted_at: new Date(baseDate.getTime() - 1 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, subscription_id: subId("ChatGPT"), merchant: "OPENAI *CHATGPT", norm: "ChatGPT", amount: 1999, category: "AI", account_label: hdfcLabel, recurring_confidence: 0.98, transacted_at: new Date(baseDate.getTime() - 2 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: icici.id, subscription_id: subId("Adobe"), merchant: "ADOBE INC", norm: "Adobe", amount: 4719, category: "Software", account_label: icicILabel, recurring_confidence: 0.97, transacted_at: new Date(baseDate.getTime() - 3 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: axis.id, subscription_id: null, merchant: "AMAZON.IN", norm: "Amazon", amount: 1340, category: "Shopping", account_label: axisLabel, recurring_confidence: 0.11, transacted_at: new Date(baseDate.getTime() - 4 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, subscription_id: subId("Spotify"), merchant: "SPOTIFY P", norm: "Spotify", amount: 179, category: "Music", account_label: hdfcLabel, recurring_confidence: 1.0, transacted_at: new Date(baseDate.getTime() - 5 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, subscription_id: null, merchant: "UBER *TRIP", norm: "Uber", amount: 218, category: "Transport", account_label: hdfcLabel, recurring_confidence: 0.22, transacted_at: new Date(baseDate.getTime() - 6 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: axis.id, subscription_id: subId("Canva"), merchant: "CANVA* PRO", norm: "Canva", amount: 499, category: "Software", account_label: axisLabel, recurring_confidence: 0.86, transacted_at: new Date(baseDate.getTime() - 7 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, subscription_id: subId("iCloud"), merchant: "ICLOUD STORAGE", norm: "iCloud", amount: 75, category: "Storage", account_label: hdfcLabel, recurring_confidence: 1.0, transacted_at: new Date(baseDate.getTime() - 8 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: axis.id, subscription_id: subId("Figma"), merchant: "FIGMA INC", norm: "Figma", amount: 1245, category: "Software", account_label: axisLabel, recurring_confidence: 1.0, transacted_at: new Date(baseDate.getTime() - 9 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, subscription_id: null, merchant: "BIGBASKET", norm: "BigBasket", amount: 2840, category: "Groceries", account_label: hdfcLabel, recurring_confidence: 0.34, transacted_at: new Date(baseDate.getTime() - 10 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, subscription_id: subId("Notion"), merchant: "NOTION LABS", norm: "Notion", amount: 830, category: "Productivity", account_label: hdfcLabel, recurring_confidence: 0.99, transacted_at: new Date(baseDate.getTime() - 11 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: hdfc.id, subscription_id: subId("GitHub"), merchant: "GITHUB COPILOT", norm: "GitHub", amount: 1670, category: "Developer", account_label: hdfcLabel, recurring_confidence: 0.97, transacted_at: new Date(baseDate.getTime() - 12 * dayMs).toISOString() },
    { user_id: userId, is_demo: true, bank_connection_id: axis.id, subscription_id: subId("YouTube"), merchant: "YT PREMIUM", norm: "YouTube", amount: 189, category: "Streaming", account_label: axisLabel, recurring_confidence: 0.99, transacted_at: new Date(baseDate.getTime() - 13 * dayMs).toISOString() },
  ]);

  // ── 4. AI Insights ───────────────────────────────────────────────────────────

  await db.from("ai_insights").insert([
    { user_id: userId, is_demo: true, subscription_id: subId("Adobe"), kind: "savings", title: "Switch Adobe to Photography plan", amount: 3420, period: "mo", body: "You only use Photoshop & Lightroom. Downgrading saves ₹41,040/yr with zero loss of utilities you actually open.", action_label: "Open Adobe plan", services: ["Adobe"] },
    { user_id: userId, is_demo: true, subscription_id: subId("Canva"), kind: "duplicate", title: "Duplicate Canva workspace billed", amount: 499, period: "mo", body: "Two Canva workspaces detected on the same Gmail — one on Axis, one billed inside your Teams plan on HDFC.", action_label: "Resolve duplicate", services: ["Canva"] },
    { user_id: userId, is_demo: true, subscription_id: subId("ChatGPT"), kind: "overlap", title: "Overlapping AI tools — ChatGPT + Claude", amount: 1999, period: "mo", body: "You use both. Last 30 days: ChatGPT 18 hrs, Claude 142 hrs. Pausing ChatGPT for a cycle recovers ₹1,999.", action_label: "Pause for a cycle", services: ["ChatGPT", "Claude"] },
    { user_id: userId, is_demo: true, subscription_id: subId("Notion"), kind: "underused", title: "Notion barely opened in 38 days", amount: 830, period: "mo", body: "Last active April 14. Either archive workspace or pause billing — Subsight will resume it the day you sign in next.", action_label: "Pause Notion", services: ["Notion"] },
    { user_id: userId, is_demo: true, subscription_id: subId("Midjourney"), kind: "trial", title: "Midjourney trial converts in 2 days", amount: 830, period: "mo", body: "Trial started May 9 via Gmail receipt. Auto-renew is currently ON.", action_label: "Review trial", services: ["Midjourney"] },
    { user_id: userId, is_demo: true, subscription_id: subId("Figma"), kind: "yearly", title: "Figma — yearly plan saves ₹3,140", amount: 3140, period: "yr", body: "Based on 8 consecutive monthly charges, yearly is structurally cheaper. Switching keeps your seat count.", action_label: "Switch to yearly", services: ["Figma"] },
  ]);

  console.log(`[seed] Demo data seeded (is_demo=true) — ${subs.length} subscriptions, 14 transactions, 6 insights`);
}
