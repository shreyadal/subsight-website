export interface MerchantInfo {
  name: string;
  category: string;
  cycle: "mo" | "yr";
}

// ─── Primary domain → merchant map ───────────────────────────────────────────
// Key is the sender email domain (last two parts, e.g. "netflix.com").

export const MERCHANT_DOMAINS: Record<string, MerchantInfo> = {
  // ── Streaming / Entertainment ─────────────────────────────────────────────
  "netflix.com":        { name: "Netflix",        category: "Entertainment",  cycle: "mo" },
  "spotify.com":        { name: "Spotify",        category: "Entertainment",  cycle: "mo" },
  "youtube.com":        { name: "YouTube",        category: "Entertainment",  cycle: "mo" },
  "primevideo.com":     { name: "Prime Video",    category: "Entertainment",  cycle: "mo" },
  "hotstar.com":        { name: "Hotstar",        category: "Entertainment",  cycle: "mo" },
  "disneyplus.com":     { name: "Disney+",        category: "Entertainment",  cycle: "mo" },
  "sonyliv.com":        { name: "SonyLIV",        category: "Entertainment",  cycle: "mo" },
  "zee5.com":           { name: "ZEE5",           category: "Entertainment",  cycle: "mo" },
  "mxplayer.in":        { name: "MX Player",      category: "Entertainment",  cycle: "mo" },
  "jiocinema.com":      { name: "JioCinema",      category: "Entertainment",  cycle: "mo" },
  "twitch.tv":          { name: "Twitch",         category: "Entertainment",  cycle: "mo" },
  "crunchyroll.com":    { name: "Crunchyroll",    category: "Entertainment",  cycle: "mo" },
  "mubi.com":           { name: "MUBI",           category: "Entertainment",  cycle: "mo" },

  // ── AI / Developer Tools ──────────────────────────────────────────────────
  "openai.com":         { name: "ChatGPT",        category: "AI Tools",       cycle: "mo" },
  "anthropic.com":      { name: "Claude",         category: "AI Tools",       cycle: "mo" },
  "midjourney.com":     { name: "Midjourney",     category: "AI Tools",       cycle: "mo" },
  "cursor.sh":          { name: "Cursor",         category: "Developer",      cycle: "mo" },
  "cursor.com":         { name: "Cursor",         category: "Developer",      cycle: "mo" },
  "github.com":         { name: "GitHub",         category: "Developer",      cycle: "mo" },
  "vercel.com":         { name: "Vercel",         category: "Developer",      cycle: "mo" },
  "netlify.com":        { name: "Netlify",        category: "Developer",      cycle: "mo" },
  "railway.app":        { name: "Railway",        category: "Developer",      cycle: "mo" },
  "render.com":         { name: "Render",         category: "Developer",      cycle: "mo" },
  "fly.io":             { name: "Fly.io",         category: "Developer",      cycle: "mo" },
  "jetbrains.com":      { name: "JetBrains",      category: "Developer",      cycle: "yr"  },
  "atlassian.com":      { name: "Atlassian",      category: "Developer",      cycle: "mo" },
  "linear.app":         { name: "Linear",         category: "Developer",      cycle: "mo" },
  "sentry.io":          { name: "Sentry",         category: "Developer",      cycle: "mo" },
  "datadog.com":        { name: "Datadog",        category: "Developer",      cycle: "mo" },
  "logtail.com":        { name: "Logtail",        category: "Developer",      cycle: "mo" },
  "planetscale.com":    { name: "PlanetScale",    category: "Developer",      cycle: "mo" },
  "supabase.com":       { name: "Supabase",       category: "Developer",      cycle: "mo" },
  "supabase.io":        { name: "Supabase",       category: "Developer",      cycle: "mo" },
  "neon.tech":          { name: "Neon",           category: "Developer",      cycle: "mo" },
  "cloudflare.com":     { name: "Cloudflare",     category: "Developer",      cycle: "mo" },
  "digitalocean.com":   { name: "DigitalOcean",   category: "Developer",      cycle: "mo" },
  "aws.amazon.com":     { name: "AWS",            category: "Developer",      cycle: "mo" },
  "twilio.com":         { name: "Twilio",         category: "Developer",      cycle: "mo" },
  "postman.com":        { name: "Postman",        category: "Developer",      cycle: "mo" },
  "raycast.com":        { name: "Raycast",        category: "Developer",      cycle: "yr"  },
  "warp.dev":           { name: "Warp",           category: "Developer",      cycle: "mo" },

  // ── Design ────────────────────────────────────────────────────────────────
  "adobe.com":          { name: "Adobe",          category: "Design",         cycle: "mo" },
  "figma.com":          { name: "Figma",          category: "Design",         cycle: "mo" },
  "canva.com":          { name: "Canva",          category: "Design",         cycle: "mo" },
  "sketch.com":         { name: "Sketch",         category: "Design",         cycle: "yr"  },
  "framer.com":         { name: "Framer",         category: "Design",         cycle: "mo" },
  "invisionapp.com":    { name: "InVision",       category: "Design",         cycle: "mo" },
  "zeplin.io":          { name: "Zeplin",         category: "Design",         cycle: "mo" },
  "lottiefiles.com":    { name: "LottieFiles",    category: "Design",         cycle: "mo" },

  // ── Productivity ──────────────────────────────────────────────────────────
  "notion.so":          { name: "Notion",         category: "Productivity",   cycle: "mo" },
  "notion.com":         { name: "Notion",         category: "Productivity",   cycle: "mo" },
  "airtable.com":       { name: "Airtable",       category: "Productivity",   cycle: "mo" },
  "coda.io":            { name: "Coda",           category: "Productivity",   cycle: "mo" },
  "clickup.com":        { name: "ClickUp",        category: "Productivity",   cycle: "mo" },
  "asana.com":          { name: "Asana",          category: "Productivity",   cycle: "mo" },
  "trello.com":         { name: "Trello",         category: "Productivity",   cycle: "mo" },
  "monday.com":         { name: "Monday.com",     category: "Productivity",   cycle: "mo" },
  "todoist.com":        { name: "Todoist",        category: "Productivity",   cycle: "mo" },
  "grammarly.com":      { name: "Grammarly",      category: "Productivity",   cycle: "mo" },
  "evernote.com":       { name: "Evernote",       category: "Productivity",   cycle: "mo" },
  "obsidian.md":        { name: "Obsidian",       category: "Productivity",   cycle: "yr"  },
  "craft.do":           { name: "Craft",          category: "Productivity",   cycle: "mo" },

  // ── Communication ─────────────────────────────────────────────────────────
  "slack.com":          { name: "Slack",          category: "Communication",  cycle: "mo" },
  "zoom.us":            { name: "Zoom",           category: "Communication",  cycle: "mo" },
  "intercom.io":        { name: "Intercom",       category: "Communication",  cycle: "mo" },
  "intercom.com":       { name: "Intercom",       category: "Communication",  cycle: "mo" },
  "loom.com":           { name: "Loom",           category: "Communication",  cycle: "mo" },
  "calendly.com":       { name: "Calendly",       category: "Productivity",   cycle: "mo" },
  "typeform.com":       { name: "Typeform",       category: "Productivity",   cycle: "mo" },

  // ── Cloud Storage ─────────────────────────────────────────────────────────
  "dropbox.com":        { name: "Dropbox",        category: "Cloud Storage",  cycle: "mo" },
  "box.com":            { name: "Box",            category: "Cloud Storage",  cycle: "mo" },

  // ── Google & Apple ────────────────────────────────────────────────────────
  // Various Google billing sender addresses
  "google.com":         { name: "Google One",     category: "Cloud Storage",  cycle: "mo" },
  "googlestore.com":    { name: "Google Store",   category: "Other",          cycle: "mo" },
  "apple.com":          { name: "Apple",          category: "Entertainment",  cycle: "mo" },
  "email.apple.com":    { name: "Apple",          category: "Entertainment",  cycle: "mo" },

  // ── Amazon ────────────────────────────────────────────────────────────────
  "amazon.com":         { name: "Amazon",         category: "Shopping",       cycle: "mo" },
  "amazon.in":          { name: "Amazon",         category: "Shopping",       cycle: "mo" },
  "amazon.co.uk":       { name: "Amazon",         category: "Shopping",       cycle: "mo" },

  // ── Microsoft ─────────────────────────────────────────────────────────────
  "microsoft.com":      { name: "Microsoft 365",  category: "Productivity",   cycle: "mo" },

  // ── Finance / CRM / Business ──────────────────────────────────────────────
  "hubspot.com":        { name: "HubSpot",        category: "CRM",            cycle: "mo" },
  "salesforce.com":     { name: "Salesforce",     category: "CRM",            cycle: "mo" },
  "quickbooks.com":     { name: "QuickBooks",     category: "Finance",        cycle: "mo" },
  "freshbooks.com":     { name: "FreshBooks",     category: "Finance",        cycle: "mo" },
  "xero.com":           { name: "Xero",           category: "Finance",        cycle: "mo" },
  "zoho.com":           { name: "Zoho",           category: "Productivity",   cycle: "mo" },
  "mailchimp.com":      { name: "Mailchimp",      category: "Marketing",      cycle: "mo" },
  "convertkit.com":     { name: "ConvertKit",     category: "Marketing",      cycle: "mo" },
  "substack.com":       { name: "Substack",       category: "Marketing",      cycle: "mo" },
  "beehiiv.com":        { name: "Beehiiv",        category: "Marketing",      cycle: "mo" },
  "sendgrid.com":       { name: "SendGrid",       category: "Developer",      cycle: "mo" },
  "resend.com":         { name: "Resend",         category: "Developer",      cycle: "mo" },

  // ── Indian services ───────────────────────────────────────────────────────
  "swiggy.in":          { name: "Swiggy One",     category: "Food",           cycle: "mo" },
  "zomato.com":         { name: "Zomato Pro",     category: "Food",           cycle: "mo" },
  "razorpay.com":       { name: "Razorpay",       category: "Finance",        cycle: "mo" },
  "cashfree.com":       { name: "Cashfree",       category: "Finance",        cycle: "mo" },
  "paytm.com":          { name: "Paytm",          category: "Finance",        cycle: "mo" },
  "phonepe.com":        { name: "PhonePe",        category: "Finance",        cycle: "mo" },
  "zerodha.com":        { name: "Zerodha",        category: "Finance",        cycle: "mo" },
  "groww.in":           { name: "Groww",          category: "Finance",        cycle: "mo" },
  "jio.com":            { name: "Jio",            category: "Telecom",        cycle: "mo" },
  "jiocinema.in":       { name: "JioCinema",      category: "Entertainment",  cycle: "mo" },
  "airtel.in":          { name: "Airtel",         category: "Telecom",        cycle: "mo" },
  "airtel.com":         { name: "Airtel",         category: "Telecom",        cycle: "mo" },
  "byjus.com":          { name: "BYJU'S",         category: "Education",      cycle: "mo" },
  "unacademy.com":      { name: "Unacademy",      category: "Education",      cycle: "mo" },
  "physicswallah.com":  { name: "Physics Wallah", category: "Education",      cycle: "mo" },
  "upstox.com":         { name: "Upstox",         category: "Finance",        cycle: "mo" },
  "angelone.in":        { name: "Angel One",      category: "Finance",        cycle: "mo" },
  "smallcase.com":      { name: "Smallcase",      category: "Finance",        cycle: "mo" },
  "kuvera.in":          { name: "Kuvera",         category: "Finance",        cycle: "mo" },
  "cleartax.in":        { name: "ClearTax",       category: "Finance",        cycle: "yr"  },
  "cult.fit":           { name: "Cult.fit",       category: "Health",         cycle: "mo" },
  "curefit.com":        { name: "Cult.fit",       category: "Health",         cycle: "mo" },
  "healthifyme.com":    { name: "HealthifyMe",    category: "Health",         cycle: "mo" },
  "tataplay.com":       { name: "Tata Play",      category: "Entertainment",  cycle: "mo" },
  "tataneu.com":        { name: "Tata Neu",       category: "Shopping",       cycle: "mo" },
  "myntra.com":         { name: "Myntra",         category: "Shopping",       cycle: "mo" },
  "nykaa.com":          { name: "Nykaa",          category: "Shopping",       cycle: "mo" },
  "meesho.com":         { name: "Meesho",         category: "Shopping",       cycle: "mo" },
  "lenskart.com":       { name: "Lenskart",       category: "Shopping",       cycle: "mo" },
  "practo.com":         { name: "Practo",         category: "Health",         cycle: "mo" },
  "1mg.com":            { name: "1mg",            category: "Health",         cycle: "mo" },
  "netmeds.com":        { name: "Netmeds",        category: "Health",         cycle: "mo" },
  "make.com":           { name: "Make",           category: "Productivity",   cycle: "mo" },
  "zapier.com":         { name: "Zapier",         category: "Productivity",   cycle: "mo" },
  "pipedream.com":      { name: "Pipedream",      category: "Developer",      cycle: "mo" },
  "n8n.io":             { name: "n8n",            category: "Developer",      cycle: "mo" },
  "retool.com":         { name: "Retool",         category: "Developer",      cycle: "mo" },
  "bubble.io":          { name: "Bubble",         category: "Developer",      cycle: "mo" },
  "mixpanel.com":       { name: "Mixpanel",       category: "Analytics",      cycle: "mo" },
  "amplitude.com":      { name: "Amplitude",      category: "Analytics",      cycle: "mo" },
  "hotjar.com":         { name: "Hotjar",         category: "Analytics",      cycle: "mo" },
  "posthog.com":        { name: "PostHog",        category: "Analytics",      cycle: "mo" },
  "segment.com":        { name: "Segment",        category: "Analytics",      cycle: "mo" },
  "liveblocks.io":      { name: "Liveblocks",     category: "Developer",      cycle: "mo" },
  "clerk.com":          { name: "Clerk",          category: "Developer",      cycle: "mo" },
  "auth0.com":          { name: "Auth0",          category: "Developer",      cycle: "mo" },
  "sanity.io":          { name: "Sanity",         category: "Developer",      cycle: "mo" },
  "contentful.com":     { name: "Contentful",     category: "Developer",      cycle: "mo" },
  "storyblok.com":      { name: "Storyblok",      category: "Developer",      cycle: "mo" },
  "algolia.com":        { name: "Algolia",        category: "Developer",      cycle: "mo" },
  "mux.com":            { name: "Mux",            category: "Developer",      cycle: "mo" },
  "lemonsqueezy.com":   { name: "Lemon Squeezy",  category: "Finance",        cycle: "mo" },
  "gumroad.com":        { name: "Gumroad",        category: "Finance",        cycle: "mo" },
  "descript.com":       { name: "Descript",       category: "Design",         cycle: "mo" },
  "rive.app":           { name: "Rive",           category: "Design",         cycle: "mo" },
  "spline.design":      { name: "Spline",         category: "Design",         cycle: "mo" },
  "screenflow.com":     { name: "ScreenFlow",     category: "Design",         cycle: "yr"  },
  "duolingo.com":       { name: "Duolingo",       category: "Education",      cycle: "mo" },
  "masterclass.com":    { name: "MasterClass",    category: "Education",      cycle: "yr"  },
  "coursera.org":       { name: "Coursera",       category: "Education",      cycle: "mo" },
  "udemy.com":          { name: "Udemy",          category: "Education",      cycle: "mo" },
  "skillshare.com":     { name: "Skillshare",     category: "Education",      cycle: "mo" },
  "brilliant.org":      { name: "Brilliant",      category: "Education",      cycle: "mo" },
  "chess.com":          { name: "Chess.com",      category: "Entertainment",  cycle: "mo" },
  "superhuman.com":     { name: "Superhuman",     category: "Productivity",   cycle: "mo" },
  "readwise.io":        { name: "Readwise",       category: "Productivity",   cycle: "mo" },
  "instapaper.com":     { name: "Instapaper",     category: "Productivity",   cycle: "mo" },
  "reeder.app":         { name: "Reeder",         category: "Productivity",   cycle: "yr"  },

  // ── No-code / CMS ─────────────────────────────────────────────────────────
  "webflow.com":        { name: "Webflow",        category: "Developer",      cycle: "mo" },
  "wordpress.com":      { name: "WordPress",      category: "Developer",      cycle: "mo" },
  "squarespace.com":    { name: "Squarespace",    category: "Developer",      cycle: "mo" },
  "wix.com":            { name: "Wix",            category: "Developer",      cycle: "mo" },
  "ghost.org":          { name: "Ghost",          category: "Developer",      cycle: "mo" },

  // ── Music / Podcasts ──────────────────────────────────────────────────────
  "gaana.com":          { name: "Gaana",          category: "Entertainment",  cycle: "mo" },
  "jiosaavn.com":       { name: "JioSaavn",       category: "Entertainment",  cycle: "mo" },
  "wynk.in":            { name: "Wynk",           category: "Entertainment",  cycle: "mo" },

  // ── Security / VPN ────────────────────────────────────────────────────────
  "nordvpn.com":        { name: "NordVPN",        category: "Security",       cycle: "yr"  },
  "expressvpn.com":     { name: "ExpressVPN",     category: "Security",       cycle: "yr"  },
  "1password.com":      { name: "1Password",      category: "Security",       cycle: "mo" },
  "lastpass.com":       { name: "LastPass",       category: "Security",       cycle: "mo" },
  "bitwarden.com":      { name: "Bitwarden",      category: "Security",       cycle: "yr"  },

  // ── Project management ────────────────────────────────────────────────────
  "basecamp.com":       { name: "Basecamp",       category: "Productivity",   cycle: "mo" },
  "height.app":         { name: "Height",         category: "Productivity",   cycle: "mo" },
  "shortcut.com":       { name: "Shortcut",       category: "Developer",      cycle: "mo" },
};

// ─── Payment processor domains ────────────────────────────────────────────────
// Emails from these domains relay billing on behalf of another merchant.
// The actual merchant name must be extracted from the subject or body.

export const PAYMENT_PROCESSOR_DOMAINS = new Set([
  "paddle.com",
  "paddle.net",
  "paddlehq.com",
  "chargebee.com",
  "recurly.com",
  "chargify.com",
  "braintreegateway.com",
  "paypal.com",
  "stripe.com",
  // Apple and Google handle billing for many apps — treat as processors
  // when the actual service name is in the subject/body
  "email.apple.com",
  "gc.apple.com",
]);

// ─── Keyword fallback ─────────────────────────────────────────────────────────
// Applied when domain lookup fails. Matches against combined From + Subject text.

export const MERCHANT_KEYWORDS: Array<[RegExp, MerchantInfo]> = [
  [/netflix/i,                      { name: "Netflix",        category: "Entertainment",  cycle: "mo" }],
  [/spotify/i,                      { name: "Spotify",        category: "Entertainment",  cycle: "mo" }],
  [/youtube\s*premium/i,            { name: "YouTube",        category: "Entertainment",  cycle: "mo" }],
  [/openai|chatgpt/i,               { name: "ChatGPT",        category: "AI Tools",       cycle: "mo" }],
  [/anthropic|claude\.ai/i,         { name: "Claude",         category: "AI Tools",       cycle: "mo" }],
  [/midjourney/i,                   { name: "Midjourney",     category: "AI Tools",       cycle: "mo" }],
  [/cursor\s*(ai|pro|ide)?/i,       { name: "Cursor",         category: "Developer",      cycle: "mo" }],
  [/adobe/i,                        { name: "Adobe",          category: "Design",         cycle: "mo" }],
  [/figma/i,                        { name: "Figma",          category: "Design",         cycle: "mo" }],
  [/canva/i,                        { name: "Canva",          category: "Design",         cycle: "mo" }],
  [/framer/i,                       { name: "Framer",         category: "Design",         cycle: "mo" }],
  [/notion/i,                       { name: "Notion",         category: "Productivity",   cycle: "mo" }],
  [/slack/i,                        { name: "Slack",          category: "Communication",  cycle: "mo" }],
  [/zoom/i,                         { name: "Zoom",           category: "Communication",  cycle: "mo" }],
  [/loom/i,                         { name: "Loom",           category: "Communication",  cycle: "mo" }],
  [/github\s*(copilot)?/i,          { name: "GitHub",         category: "Developer",      cycle: "mo" }],
  [/vercel/i,                       { name: "Vercel",         category: "Developer",      cycle: "mo" }],
  [/linear\s*(app)?/i,              { name: "Linear",         category: "Developer",      cycle: "mo" }],
  [/raycast/i,                      { name: "Raycast",        category: "Developer",      cycle: "yr"  }],
  [/webflow/i,                      { name: "Webflow",        category: "Developer",      cycle: "mo" }],
  [/hotstar|disney\+?/i,            { name: "Hotstar",        category: "Entertainment",  cycle: "mo" }],
  [/prime\s*video|primevideo/i,     { name: "Prime Video",    category: "Entertainment",  cycle: "mo" }],
  [/google\s*one/i,                 { name: "Google One",     category: "Cloud Storage",  cycle: "mo" }],
  [/google\s*workspace/i,           { name: "Google Workspace", category: "Productivity", cycle: "mo" }],
  [/microsoft\s*365|office\s*365/i, { name: "Microsoft 365",  category: "Productivity",   cycle: "mo" }],
  [/dropbox/i,                      { name: "Dropbox",        category: "Cloud Storage",  cycle: "mo" }],
  [/1password|onepassword/i,        { name: "1Password",      category: "Security",       cycle: "mo" }],
  [/nordvpn/i,                      { name: "NordVPN",        category: "Security",       cycle: "yr"  }],
  [/swiggy\s*one/i,                 { name: "Swiggy One",     category: "Food",           cycle: "mo" }],
  [/zomato\s*(pro|gold)?/i,         { name: "Zomato Pro",     category: "Food",           cycle: "mo" }],
  [/grammarly/i,                    { name: "Grammarly",      category: "Productivity",   cycle: "mo" }],
  [/airtable/i,                     { name: "Airtable",       category: "Productivity",   cycle: "mo" }],
  [/clickup/i,                      { name: "ClickUp",        category: "Productivity",   cycle: "mo" }],
  [/mailchimp/i,                    { name: "Mailchimp",      category: "Marketing",      cycle: "mo" }],
  [/substack/i,                     { name: "Substack",       category: "Marketing",      cycle: "mo" }],
  [/jio\s*(cinema|saavn|hotstar)?/i, { name: "Jio",           category: "Telecom",        cycle: "mo" }],
  [/airtel\s*(xstream|thanks)?/i,   { name: "Airtel",         category: "Telecom",        cycle: "mo" }],
  [/byju/i,                         { name: "BYJU'S",         category: "Education",      cycle: "mo" }],
  [/unacademy/i,                    { name: "Unacademy",      category: "Education",      cycle: "mo" }],
  [/hotstar|disney\s*\+/i,          { name: "Hotstar",        category: "Entertainment",  cycle: "mo" }],
  [/cult\.fit|curefit/i,            { name: "Cult.fit",       category: "Health",         cycle: "mo" }],
  [/zerodha/i,                      { name: "Zerodha",        category: "Finance",        cycle: "mo" }],
  [/groww/i,                        { name: "Groww",          category: "Finance",        cycle: "mo" }],
  [/duolingo/i,                     { name: "Duolingo",       category: "Education",      cycle: "mo" }],
  [/coursera/i,                     { name: "Coursera",       category: "Education",      cycle: "mo" }],
  [/masterclass/i,                  { name: "MasterClass",    category: "Education",      cycle: "yr"  }],
  [/zapier/i,                       { name: "Zapier",         category: "Productivity",   cycle: "mo" }],
  [/make\.com|integromat/i,         { name: "Make",           category: "Productivity",   cycle: "mo" }],
  [/superhuman/i,                   { name: "Superhuman",     category: "Productivity",   cycle: "mo" }],
  [/apple\s*(one|tv|music|arcade|icloud)/i, { name: "Apple", category: "Entertainment",  cycle: "mo" }],
  [/google\s*(play|one|workspace|storage)/i, { name: "Google One", category: "Cloud Storage", cycle: "mo" }],
  [/microsoft\s*(365|office|teams)/i, { name: "Microsoft 365", category: "Productivity", cycle: "mo" }],
];

// ─── Payment processor subject extraction ─────────────────────────────────────
// When From domain is a payment processor, the actual merchant is usually named
// in the subject line. These patterns extract it.

const PROCESSOR_SUBJECT_PATTERNS = [
  // "Your Cursor receipt"  /  "Your Framer invoice"
  /^your\s+(.+?)\s+(?:receipt|invoice|subscription|order|payment)\b/i,
  // "Receipt from Linear"  /  "Invoice from Raycast #123"
  /\b(?:receipt|invoice)\s+from\s+(.+?)(?:\s+#\d|\s+for\s|\s+-\s|$)/i,
  // "Framer · Your invoice"  /  "Linear - Annual subscription"
  /^([^·\-–|]+?)\s*[·\-–|]\s*(?:your\s+)?(?:invoice|receipt|subscription|billing|payment|plan)/i,
  // "Thanks for subscribing to Cursor"
  /\bsubscribing?\s+to\s+(.+?)(?:\s+plan|\s+pro|\s+lite|\s+-|$)/i,
  // "Payment for Linear Pro"  /  "Charge for Vercel Pro"
  /\b(?:payment|charge)\s+(?:for|from)\s+(.+?)(?:\s+(?:pro|plan|lite|plus|team))?(?:\s+-|\s+#|$)/i,
  // "Cursor Pro - Payment Receipt"
  /^(.+?)\s+(?:pro|plus|lite|team|annual|monthly|basic|standard|enterprise)\s*[-–]\s*(?:payment|receipt|invoice)/i,
  // "Annual subscription to Raycast"
  /\b(?:annual|monthly|yearly)\s+subscription\s+(?:to|for)\s+(.+?)(?:\s+-|\s+#|$)/i,
];

// Merchant names that are themselves payment processors or generic — reject these
// to avoid calling the candidate "Stripe" or "the" when parsing subjects.
const REJECTED_CANDIDATES = new Set([
  "stripe", "paddle", "paypal", "braintree", "chargebee", "recurly",
  "your", "the", "a", "an", "our", "this", "that", "us", "team",
]);

export function extractMerchantFromProcessorSubject(
  subject: string
): string | null {
  for (const pattern of PROCESSOR_SUBJECT_PATTERNS) {
    const m = subject.match(pattern);
    if (m?.[1]) {
      const raw = m[1].trim();
      // Clean up trailing punctuation / plan names
      const candidate = raw.replace(/\s+(pro|plus|lite|basic|team|plan|annual|monthly)$/i, "").trim();

      if (
        candidate.length >= 2 &&
        candidate.length <= 50 &&
        !REJECTED_CANDIDATES.has(candidate.toLowerCase())
      ) {
        return candidate;
      }
    }
  }
  return null;
}

// ─── Unified merchant lookup ──────────────────────────────────────────────────

export function lookupMerchant(
  fromAddress: string,
  subject: string
): MerchantInfo | null {
  // 1. Extract sender domain
  const domainMatch = fromAddress.match(/@([\w.-]+)/);
  const rawDomain = domainMatch?.[1]?.toLowerCase() ?? "";

  // 2. Exact domain match
  if (rawDomain && MERCHANT_DOMAINS[rawDomain]) return MERCHANT_DOMAINS[rawDomain];

  // 3. Parent domain match (e.g. "billing.netflix.com" → "netflix.com")
  if (rawDomain) {
    const parts = rawDomain.split(".");
    if (parts.length > 2) {
      const parent = parts.slice(-2).join(".");
      if (MERCHANT_DOMAINS[parent]) return MERCHANT_DOMAINS[parent];
    }
  }

  // 4. Payment processor — merchant name is in the subject
  if (rawDomain) {
    const processorParent =
      rawDomain.split(".").length > 2
        ? rawDomain.split(".").slice(-2).join(".")
        : rawDomain;

    if (PAYMENT_PROCESSOR_DOMAINS.has(processorParent)) {
      const extracted = extractMerchantFromProcessorSubject(subject);
      if (extracted) {
        // Try to enrich with domain-level info for known merchants
        const known = lookupByName(extracted);
        return (
          known ?? {
            name: toTitleCase(extracted),
            category: "Other",
            cycle: "mo",
          }
        );
      }
    }
  }

  // 5. Keyword scan across From + Subject
  const text = `${fromAddress} ${subject}`;
  for (const [pattern, info] of MERCHANT_KEYWORDS) {
    if (pattern.test(text)) return info;
  }

  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Check if a sender domain is a known payment processor.
export function isPaymentProcessor(fromAddress: string): boolean {
  const m = fromAddress.match(/@([\w.-]+)/);
  if (!m) return false;
  const domain = m[1].toLowerCase();
  const parent = domain.split(".").length > 2
    ? domain.split(".").slice(-2).join(".")
    : domain;
  return PAYMENT_PROCESSOR_DOMAINS.has(domain) || PAYMENT_PROCESSOR_DOMAINS.has(parent);
}

// Try to match a merchant name string against known merchant names.
function lookupByName(name: string): MerchantInfo | null {
  const lower = name.toLowerCase();
  for (const info of Object.values(MERCHANT_DOMAINS)) {
    if (info.name.toLowerCase() === lower) return info;
  }
  for (const [, info] of MERCHANT_KEYWORDS) {
    if (info.name.toLowerCase() === lower) return info;
  }
  return null;
}

function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Enrich an AI-provided merchant name with known category/cycle data if available.
export function enrichMerchantInfo(name: string, category: string, cycle: "mo" | "yr"): MerchantInfo {
  const known = lookupByName(name);
  return known ?? { name: toTitleCase(name), category, cycle };
}
