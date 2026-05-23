export interface MerchantInfo {
  name: string;
  category: string;
  cycle: "mo" | "yr";
}

// Primary map: sender email domain → merchant info.
// Also used to normalise merchant names from subject keyword fallback.
export const MERCHANT_DOMAINS: Record<string, MerchantInfo> = {
  // ── Entertainment ────────────────────────────────────────────────────────────
  "netflix.com":      { name: "Netflix",      category: "Entertainment", cycle: "mo" },
  "spotify.com":      { name: "Spotify",      category: "Entertainment", cycle: "mo" },
  "youtube.com":      { name: "YouTube",      category: "Entertainment", cycle: "mo" },
  "apple.com":        { name: "Apple",        category: "Entertainment", cycle: "mo" },
  "primevideo.com":   { name: "Prime Video",  category: "Entertainment", cycle: "mo" },
  "hotstar.com":      { name: "Hotstar",      category: "Entertainment", cycle: "mo" },
  "disneyplus.com":   { name: "Disney+",      category: "Entertainment", cycle: "mo" },
  "sonyliv.com":      { name: "SonyLIV",      category: "Entertainment", cycle: "mo" },
  "zee5.com":         { name: "ZEE5",         category: "Entertainment", cycle: "mo" },
  "mxplayer.in":      { name: "MX Player",    category: "Entertainment", cycle: "mo" },

  // ── AI / Productivity ────────────────────────────────────────────────────────
  "openai.com":       { name: "ChatGPT",      category: "AI Tools",      cycle: "mo" },
  "anthropic.com":    { name: "Claude",       category: "AI Tools",      cycle: "mo" },
  "midjourney.com":   { name: "Midjourney",   category: "AI Tools",      cycle: "mo" },
  "github.com":       { name: "GitHub",       category: "Developer",     cycle: "mo" },
  "notion.so":        { name: "Notion",       category: "Productivity",  cycle: "mo" },
  "notion.com":       { name: "Notion",       category: "Productivity",  cycle: "mo" },
  "figma.com":        { name: "Figma",        category: "Design",        cycle: "mo" },
  "canva.com":        { name: "Canva",        category: "Design",        cycle: "mo" },
  "slack.com":        { name: "Slack",        category: "Communication", cycle: "mo" },

  // ── Adobe ────────────────────────────────────────────────────────────────────
  "adobe.com":        { name: "Adobe",        category: "Design",        cycle: "mo" },

  // ── Google ───────────────────────────────────────────────────────────────────
  "google.com":       { name: "Google One",   category: "Cloud Storage", cycle: "mo" },
  "googlestore.com":  { name: "Google",       category: "Other",         cycle: "mo" },

  // ── Amazon ───────────────────────────────────────────────────────────────────
  "amazon.com":       { name: "Amazon",       category: "Shopping",      cycle: "mo" },
  "amazon.in":        { name: "Amazon",       category: "Shopping",      cycle: "mo" },

  // ── Cloud & Dev ──────────────────────────────────────────────────────────────
  "dropbox.com":      { name: "Dropbox",      category: "Cloud Storage", cycle: "mo" },
  "box.com":          { name: "Box",          category: "Cloud Storage", cycle: "mo" },
  "zoom.us":          { name: "Zoom",         category: "Communication", cycle: "mo" },
  "atlassian.com":    { name: "Atlassian",    category: "Developer",     cycle: "mo" },
  "jetbrains.com":    { name: "JetBrains",    category: "Developer",     cycle: "yr"  },
  "vercel.com":       { name: "Vercel",       category: "Developer",     cycle: "mo" },

  // ── Finance / Business ───────────────────────────────────────────────────────
  "razorpay.com":     { name: "Razorpay",     category: "Finance",       cycle: "mo" },
  "stripe.com":       { name: "Stripe",       category: "Finance",       cycle: "mo" },
  "quickbooks.com":   { name: "QuickBooks",   category: "Finance",       cycle: "mo" },
};

// Fallback: look for these keywords in the From name / Subject.
// Used when the sender domain is not in MERCHANT_DOMAINS.
export const MERCHANT_KEYWORDS: Array<[RegExp, MerchantInfo]> = [
  [/netflix/i,      { name: "Netflix",      category: "Entertainment", cycle: "mo" }],
  [/spotify/i,      { name: "Spotify",      category: "Entertainment", cycle: "mo" }],
  [/youtube/i,      { name: "YouTube",      category: "Entertainment", cycle: "mo" }],
  [/openai|chatgpt/i,{ name: "ChatGPT",     category: "AI Tools",      cycle: "mo" }],
  [/midjourney/i,   { name: "Midjourney",   category: "AI Tools",      cycle: "mo" }],
  [/adobe/i,        { name: "Adobe",        category: "Design",        cycle: "mo" }],
  [/apple/i,        { name: "Apple",        category: "Entertainment", cycle: "mo" }],
  [/amazon/i,       { name: "Amazon",       category: "Shopping",      cycle: "mo" }],
  [/figma/i,        { name: "Figma",        category: "Design",        cycle: "mo" }],
  [/notion/i,       { name: "Notion",       category: "Productivity",  cycle: "mo" }],
  [/canva/i,        { name: "Canva",        category: "Design",        cycle: "mo" }],
  [/github/i,       { name: "GitHub",       category: "Developer",     cycle: "mo" }],
  [/slack/i,        { name: "Slack",        category: "Communication", cycle: "mo" }],
  [/hotstar|disney/i,{ name: "Hotstar",     category: "Entertainment", cycle: "mo" }],
  [/prime video|primevideo/i, { name: "Prime Video", category: "Entertainment", cycle: "mo" }],
  [/google one|google storage/i, { name: "Google One", category: "Cloud Storage", cycle: "mo" }],
  [/dropbox/i,      { name: "Dropbox",      category: "Cloud Storage", cycle: "mo" }],
  [/zoom/i,         { name: "Zoom",         category: "Communication", cycle: "mo" }],
];

export function lookupMerchant(fromAddress: string, subject: string): MerchantInfo | null {
  // 1. Try exact domain match from "From" header
  const domainMatch = fromAddress.match(/@([\w.-]+)/);
  if (domainMatch) {
    const domain = domainMatch[1].toLowerCase();
    // Try full domain, then parent domain
    if (MERCHANT_DOMAINS[domain]) return MERCHANT_DOMAINS[domain];
    const parts = domain.split(".");
    if (parts.length > 2) {
      const parent = parts.slice(-2).join(".");
      if (MERCHANT_DOMAINS[parent]) return MERCHANT_DOMAINS[parent];
    }
  }

  // 2. Keyword search across both From and Subject
  const text = `${fromAddress} ${subject}`;
  for (const [pattern, info] of MERCHANT_KEYWORDS) {
    if (pattern.test(text)) return info;
  }

  return null;
}
