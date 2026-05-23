export interface Subscription {
  id: string;
  name: string;
  plan: string;
  price: number;
  cycle: "mo" | "yr";
  renew: string;
  source: string;
  cat: string;
  conf: number;
  active: boolean;
  insight: string | null;
  tag: string | null;
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  norm: string;
  amt: number;
  acct: string;
  cat: string;
  recurring: number;
}

export interface Account {
  id: string;
  name: string;
  acct: string;
  kind: string;
  synced: string;
  status: "live" | "reconnect";
  subs: number;
  color: string;
}

export interface Insight {
  id: string;
  kind: string;
  title: string;
  amount: number;
  period: string;
  body: string;
  action: string;
  services: string[];
}

export interface Renewal {
  id: string;
  name: string;
  in: string;
  date: string;
  price: number;
}

export const SUBSCRIPTIONS: Subscription[] = [
  { id: "s1", name: "Netflix", plan: "Premium 4K", price: 649, cycle: "mo", renew: "May 28", source: "HDFC •• 4421", cat: "Streaming", conf: 0.99, active: true, insight: "Stable charge. No price change in 8 cycles.", tag: null },
  { id: "s2", name: "Adobe", plan: "Creative Cloud", price: 4719, cycle: "mo", renew: "Jun 02", source: "ICICI •• 8810", cat: "Software", conf: 0.97, active: true, insight: "Potential overspending — switch to Photography plan saves ₹3,420/mo.", tag: "overspend" },
  { id: "s3", name: "Spotify", plan: "Family", price: 179, cycle: "mo", renew: "May 25", source: "HDFC •• 4421", cat: "Music", conf: 1.0, active: true, insight: "Renews in 3 days. Family plan unused by 2 of 6 members.", tag: "renew-soon" },
  { id: "s4", name: "Canva", plan: "Pro · Workspace #2", price: 499, cycle: "mo", renew: "Jun 11", source: "Axis •• 1102", cat: "Software", conf: 0.86, active: true, insight: "Duplicate workspace — you already pay for Canva Teams on HDFC.", tag: "duplicate" },
  { id: "s5", name: "ChatGPT", plan: "Plus", price: 1999, cycle: "mo", renew: "Jun 04", source: "HDFC •• 4421", cat: "AI", conf: 0.98, active: true, insight: "Overlaps with Claude Pro on this account. Consider consolidating.", tag: "overlap" },
  { id: "s6", name: "Claude", plan: "Pro", price: 1700, cycle: "mo", renew: "Jun 09", source: "ICICI •• 8810", cat: "AI", conf: 0.95, active: true, insight: "Used 142 hrs last month — your highest-value AI subscription.", tag: null },
  { id: "s7", name: "Notion", plan: "Plus", price: 830, cycle: "mo", renew: "Jun 14", source: "HDFC •• 4421", cat: "Productivity", conf: 0.99, active: true, insight: "Underused — last active 38 days ago.", tag: "underused" },
  { id: "s8", name: "Figma", plan: "Professional", price: 1245, cycle: "mo", renew: "Jun 18", source: "Axis •• 1102", cat: "Software", conf: 1.0, active: true, insight: "Heavy use detected. Yearly plan would save ₹3,140.", tag: "yearly-save" },
  { id: "s9", name: "Linear", plan: "Standard", price: 680, cycle: "mo", renew: "Jun 21", source: "ICICI •• 8810", cat: "Productivity", conf: 0.92, active: true, insight: null, tag: null },
  { id: "s10", name: "Midjourney", plan: "Standard", price: 830, cycle: "mo", renew: "Jul 01", source: "HDFC •• 4421", cat: "AI", conf: 0.88, active: true, insight: "Free trial ends in 2 days — auto-renew on.", tag: "trial" },
  { id: "s11", name: "iCloud", plan: "200 GB", price: 75, cycle: "mo", renew: "May 31", source: "HDFC •• 4421", cat: "Storage", conf: 1.0, active: true, insight: null, tag: null },
  { id: "s12", name: "YouTube", plan: "Premium Family", price: 189, cycle: "mo", renew: "Jun 07", source: "Axis •• 1102", cat: "Streaming", conf: 0.99, active: true, insight: null, tag: null },
  { id: "s13", name: "Hotstar", plan: "Super", price: 299, cycle: "mo", renew: "paused", source: "ICICI •• 8810", cat: "Streaming", conf: 0.81, active: false, insight: "Paused last cycle. Auto-detected.", tag: null },
  { id: "s14", name: "GitHub", plan: "Copilot · Business", price: 1670, cycle: "mo", renew: "Jun 22", source: "HDFC •• 4421", cat: "Developer", conf: 0.97, active: true, insight: null, tag: null },
  { id: "s15", name: "Cursor", plan: "Pro", price: 1670, cycle: "mo", renew: "Jun 17", source: "HDFC •• 4421", cat: "Developer", conf: 0.94, active: true, insight: "Heavy overlap with Copilot — consider one.", tag: "overlap" },
];

export const TRANSACTIONS: Transaction[] = [
  { id: "t1", date: "May 22", merchant: "NETFLIX.COM", norm: "Netflix", amt: 649, acct: "HDFC •• 4421", cat: "Streaming", recurring: 0.99 },
  { id: "t2", date: "May 21", merchant: "SWIGGY", norm: "Swiggy", amt: 540, acct: "HDFC •• 4421", cat: "Food", recurring: 0.04 },
  { id: "t3", date: "May 20", merchant: "OPENAI *CHATGPT", norm: "ChatGPT", amt: 1999, acct: "HDFC •• 4421", cat: "AI", recurring: 0.98 },
  { id: "t4", date: "May 19", merchant: "ADOBE INC", norm: "Adobe", amt: 4719, acct: "ICICI •• 8810", cat: "Software", recurring: 0.97 },
  { id: "t5", date: "May 18", merchant: "AMAZON.IN", norm: "Amazon", amt: 1340, acct: "Axis •• 1102", cat: "Shopping", recurring: 0.11 },
  { id: "t6", date: "May 17", merchant: "SPOTIFY P", norm: "Spotify", amt: 179, acct: "HDFC •• 4421", cat: "Music", recurring: 1.0 },
  { id: "t7", date: "May 16", merchant: "UBER *TRIP", norm: "Uber", amt: 218, acct: "HDFC •• 4421", cat: "Transport", recurring: 0.22 },
  { id: "t8", date: "May 15", merchant: "CANVA* PRO", norm: "Canva", amt: 499, acct: "Axis •• 1102", cat: "Software", recurring: 0.86 },
  { id: "t9", date: "May 14", merchant: "ICLOUD STORAGE", norm: "iCloud", amt: 75, acct: "HDFC •• 4421", cat: "Storage", recurring: 1.0 },
  { id: "t10", date: "May 13", merchant: "FIGMA INC", norm: "Figma", amt: 1245, acct: "Axis •• 1102", cat: "Software", recurring: 1.0 },
  { id: "t11", date: "May 12", merchant: "BIGBASKET", norm: "BigBasket", amt: 2840, acct: "HDFC •• 4421", cat: "Groceries", recurring: 0.34 },
  { id: "t12", date: "May 11", merchant: "NOTION LABS", norm: "Notion", amt: 830, acct: "HDFC •• 4421", cat: "Productivity", recurring: 0.99 },
  { id: "t13", date: "May 10", merchant: "GITHUB COPILOT", norm: "GitHub", amt: 1670, acct: "HDFC •• 4421", cat: "Developer", recurring: 0.97 },
  { id: "t14", date: "May 09", merchant: "YT PREMIUM", norm: "YouTube", amt: 189, acct: "Axis •• 1102", cat: "Streaming", recurring: 0.99 },
];

export const ACCOUNTS: Account[] = [
  { id: "a1", name: "HDFC Bank", acct: "•• 4421", kind: "Savings · Primary", synced: "2 min ago", status: "live", subs: 9, color: "oklch(0.30 0.10 250)" },
  { id: "a2", name: "ICICI Bank", acct: "•• 8810", kind: "Savings", synced: "8 min ago", status: "live", subs: 3, color: "oklch(0.30 0.10 25)" },
  { id: "a3", name: "Axis Bank", acct: "•• 1102", kind: "Credit Card", synced: "1 hr ago", status: "live", subs: 4, color: "oklch(0.30 0.10 350)" },
  { id: "a4", name: "Kotak", acct: "•• 7720", kind: "Savings", synced: "3 days ago", status: "reconnect", subs: 0, color: "oklch(0.28 0.08 25)" },
];

export const INSIGHTS: Insight[] = [
  { id: "i1", kind: "savings", title: "Switch Adobe to Photography plan", amount: 3420, period: "mo", body: "You only use Photoshop & Lightroom. Downgrading saves ₹41,040/yr with zero loss of utilities you actually open.", action: "Open Adobe plan", services: ["Adobe"] },
  { id: "i2", kind: "duplicate", title: "Duplicate Canva workspace billed", amount: 499, period: "mo", body: "Two Canva workspaces detected on the same Gmail — one on Axis, one billed inside your Teams plan on HDFC.", action: "Resolve duplicate", services: ["Canva"] },
  { id: "i3", kind: "overlap", title: "Overlapping AI tools — ChatGPT + Claude", amount: 1999, period: "mo", body: "You use both. Last 30 days: ChatGPT 18 hrs, Claude 142 hrs. Pausing ChatGPT for a cycle recovers ₹1,999.", action: "Pause for a cycle", services: ["ChatGPT", "Claude"] },
  { id: "i4", kind: "underused", title: "Notion barely opened in 38 days", amount: 830, period: "mo", body: "Last active April 14. Either archive workspace or pause billing — Subsight will resume it the day you sign in next.", action: "Pause Notion", services: ["Notion"] },
  { id: "i5", kind: "trial", title: "Midjourney trial converts in 2 days", amount: 830, period: "mo", body: "Trial started May 9 via Gmail receipt. Auto-renew is currently ON.", action: "Review trial", services: ["Midjourney"] },
  { id: "i6", kind: "yearly", title: "Figma — yearly plan saves ₹3,140", amount: 3140, period: "yr", body: "Based on 8 consecutive monthly charges, yearly is structurally cheaper. Switching keeps your seat count.", action: "Switch to yearly", services: ["Figma"] },
];

export const RENEWALS: Renewal[] = [
  { id: "r1", name: "Spotify", in: "3 days", date: "May 25", price: 179 },
  { id: "r2", name: "Netflix", in: "6 days", date: "May 28", price: 649 },
  { id: "r3", name: "iCloud", in: "9 days", date: "May 31", price: 75 },
  { id: "r4", name: "Adobe", in: "11 days", date: "Jun 02", price: 4719 },
  { id: "r5", name: "ChatGPT", in: "13 days", date: "Jun 04", price: 1999 },
];

export const SERVICE_STYLES: Record<string, { mono: string; bg: string; fg: string }> = {
  Netflix: { mono: "N", bg: "oklch(0.30 0.16 25)", fg: "oklch(0.90 0.16 25)" },
  Adobe: { mono: "Ai", bg: "oklch(0.30 0.14 25)", fg: "oklch(0.88 0.18 25)" },
  Spotify: { mono: "♪", bg: "oklch(0.30 0.14 155)", fg: "oklch(0.88 0.18 155)" },
  Canva: { mono: "C", bg: "oklch(0.30 0.10 230)", fg: "oklch(0.90 0.16 230)" },
  ChatGPT: { mono: "AI", bg: "oklch(0.28 0.08 155)", fg: "oklch(0.88 0.14 155)" },
  Claude: { mono: "C", bg: "oklch(0.30 0.10 65)", fg: "oklch(0.90 0.16 65)" },
  Notion: { mono: "N", bg: "oklch(0.22 0.005 70)", fg: "oklch(0.96 0.005 70)" },
  Figma: { mono: "F", bg: "oklch(0.30 0.12 310)", fg: "oklch(0.88 0.14 310)" },
  Linear: { mono: "L", bg: "oklch(0.28 0.10 270)", fg: "oklch(0.90 0.14 270)" },
  Midjourney: { mono: "M", bg: "oklch(0.28 0.006 70)", fg: "oklch(0.94 0.006 70)" },
  iCloud: { mono: "☁", bg: "oklch(0.30 0.08 230)", fg: "oklch(0.90 0.14 230)" },
  YouTube: { mono: "▶", bg: "oklch(0.30 0.16 25)", fg: "oklch(0.90 0.18 25)" },
  Hotstar: { mono: "H", bg: "oklch(0.28 0.10 270)", fg: "oklch(0.90 0.16 270)" },
  GitHub: { mono: "GH", bg: "oklch(0.20 0.005 70)", fg: "oklch(0.96 0.005 70)" },
  Cursor: { mono: "Cu", bg: "oklch(0.28 0.008 70)", fg: "oklch(0.94 0.008 70)" },
  Vercel: { mono: "▲", bg: "oklch(0.20 0.005 70)", fg: "oklch(0.96 0.005 70)" },
  HDFC: { mono: "H", bg: "oklch(0.28 0.08 250)", fg: "oklch(0.90 0.14 250)" },
  ICICI: { mono: "I", bg: "oklch(0.30 0.10 25)", fg: "oklch(0.90 0.16 25)" },
  Axis: { mono: "A", bg: "oklch(0.30 0.10 350)", fg: "oklch(0.90 0.16 350)" },
  Kotak: { mono: "K", bg: "oklch(0.28 0.08 25)", fg: "oklch(0.90 0.14 25)" },
  SBI: { mono: "S", bg: "oklch(0.30 0.10 250)", fg: "oklch(0.90 0.16 250)" },
  Swiggy: { mono: "S", bg: "oklch(0.30 0.12 50)", fg: "oklch(0.90 0.16 50)" },
  Amazon: { mono: "A", bg: "oklch(0.30 0.10 65)", fg: "oklch(0.90 0.16 65)" },
  Uber: { mono: "U", bg: "oklch(0.20 0.005 70)", fg: "oklch(0.96 0.005 70)" },
  BigBasket: { mono: "BB", bg: "oklch(0.30 0.14 155)", fg: "oklch(0.88 0.18 155)" },
};

export const NAV = [
  { id: "overview", label: "Overview", icon: "layout-dashboard" },
  { id: "subscriptions", label: "Subscriptions", icon: "layers" },
  { id: "transactions", label: "Transactions", icon: "arrow-left-right" },
  { id: "insights", label: "Insights", icon: "sparkles" },
  { id: "accounts", label: "Connected Accounts", icon: "landmark" },
  { id: "gmail", label: "Gmail Sync", icon: "mail" },
  { id: "uploads", label: "Uploads", icon: "upload" },
  { id: "settings", label: "Settings", icon: "settings" },
];
