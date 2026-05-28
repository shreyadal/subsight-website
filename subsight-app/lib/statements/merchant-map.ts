/**
 * Merchant normalization for Indian bank statement descriptions.
 *
 * Bank statement transaction descriptions are messy — they mix payment-type
 * prefixes (UPI, NACH, ECS, CARD), reference numbers, and merchant identifiers.
 * This module extracts the canonical merchant name, category, and whether the
 * payment method implies a standing instruction (always recurring).
 */

export interface NormalizedMerchant {
  name: string;
  category: string;
  confidence: number;       // 0–1; higher = more certain
  paymentMethod: string;    // UPI | NACH | ECS | CARD | NEFT | ATM | OTHER
  isStandingInstruction: boolean;  // NACH/ECS/SI — always recurring
}

// ─── Payment-method prefix detection ─────────────────────────────────────────

const UPI_RE    = /^\s*UPI[\/\-\s]/i;
const NACH_RE   = /^\s*NACH[\/\-\s]/i;
const ECS_RE    = /^\s*ECS[\/\-\s]/i;
const SI_RE     = /^\s*(SI|STANDING\s*INSTRUCTION)[\/\-\s]/i;
const NEFT_RE   = /^\s*(NEFT|RTGS|IMPS)[\/\-\s]/i;
const ATM_RE    = /^\s*(ATW|ATM)[\/\-\s]/i;
const CARD_RE   = /^\s*(POS|VISA|MC|MASTERCARD|RUPAY|DEBIT\s*CARD|CREDIT\s*CARD)[\/\-\s]/i;
const INT_RE    = /^\s*(INT|INTEREST|CHQ|CHEQUE|DIVIDEND|REFUND|CASHBACK|REWARD)/i;

function detectPaymentMethod(desc: string): string {
  if (ATM_RE.test(desc))  return "ATM";
  if (NACH_RE.test(desc)) return "NACH";
  if (ECS_RE.test(desc))  return "ECS";
  if (SI_RE.test(desc))   return "SI";
  if (UPI_RE.test(desc))  return "UPI";
  if (NEFT_RE.test(desc)) return "NEFT";
  if (CARD_RE.test(desc)) return "CARD";
  return "OTHER";
}

// ─── Skip list — bank-internal rows that aren't real purchases ────────────────

const SKIP_PATTERNS = [
  /\b(ATM|ATW)\b/i,                                    // ATM cash withdrawal
  /\b(NEFT|RTGS|IMPS)\b/i,                             // bank transfers
  /\b(INTEREST|INT\s+CREDIT|INT\s+DR)\b/i,             // interest
  /\b(DIVIDEND|DIV\s+CREDIT)\b/i,                      // dividend
  /\b(SERVICE\s+CHARGE|ANNUAL\s+FEE|LATE\s+FEE)\b/i,  // bank fees
  /\b(CHQ|CHEQUE)\b/i,                                 // cheques
  /\b(SALARY|PAYROLL|WAGES)\b/i,                       // incoming salary
  /\b(CASHBACK|REWARD\s+POINT|CASHBK)\b/i,             // cashback (credit)
  /\b(REFUND|REVERSAL|REVERSL)\b/i,                    // refunds
  /\b(TAX\s+DEDUCT|TDS|GST)\b/i,                       // tax deductions
  /\b(OPENING\s+BAL|CLOSING\s+BAL)\b/i,                // balance lines
  /\b(LIEN|HOLD|BLOCK)\b/i,                             // blocked amounts
];

export function shouldSkipTransaction(description: string): boolean {
  const desc = description.toUpperCase();
  return SKIP_PATTERNS.some((re) => re.test(desc));
}

// ─── UPI description parsing ─────────────────────────────────────────────────
// HDFC format:  UPI/REF/merchant@bank/RemarkOrName
// ICICI format: UPI-RemarkOrMerchant-merchant@upiid-TXNID...
// Axis format:  UPI/TXNID/merchant@upiid/Remark

function extractFromUPI(raw: string): string | null {
  // Pattern 1: UPI/ref/upi@id/name   → prefer the name segment
  const slash = raw.match(/UPI[\/\-][^\/\-]+[\/\-]([^\/\-@]+)@[^\/\-]+[\/\-](.+)/i);
  if (slash) {
    const name = slash[2].trim();
    if (name.length > 1) return cleanSegment(name);
  }
  // Pattern 2: UPI/ref/upi@id   → use part before @
  const atPart = raw.match(/UPI[\/\-][^\/\-]+[\/\-]([^@\/\-]+)@/i);
  if (atPart) return cleanSegment(atPart[1]);

  // Pattern 3: UPI-Remark-merchant@bank-...  (ICICI style)
  const icici = raw.match(/UPI[-\/]([A-Z][A-Z0-9\s\.\-]+?)[-\/][A-Z0-9]+@/i);
  if (icici) return cleanSegment(icici[1]);

  return null;
}

function extractFromNACH(raw: string): string | null {
  // NACH/ref/COMPANY NAME/...  or  NACH-COMPANY NAME-ref
  const m = raw.match(/NACH[\/\-\s]+(?:\d+[\/\-\s]+)?([A-Z][A-Z\s\.\&]+?)(?:[\/\-]|\d{4,}|$)/i);
  return m ? cleanSegment(m[1]) : null;
}

function extractFromECS(raw: string): string | null {
  const m = raw.match(/ECS[\/\-\s]+([A-Z][A-Z\s\.\&]+?)(?:[\/\-]|\d{4,}|$)/i);
  return m ? cleanSegment(m[1]) : null;
}

function cleanSegment(s: string): string {
  return s
    .replace(/[_\*]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^\W+|\W+$/, "")
    .trim();
}

// ─── Merchant pattern table ───────────────────────────────────────────────────
// Each entry: [regex, canonicalName, category]
// Ordered from most-specific to least-specific.

type PatternEntry = [RegExp, string, string];

const MERCHANT_PATTERNS: PatternEntry[] = [
  // ── Streaming / Entertainment ───────────────────────────────────────────────
  [/\bNFLX\b|\bNETFLIX\b/i,                        "Netflix",        "Entertainment"],
  [/\bSPOTIFY\b/i,                                  "Spotify",        "Entertainment"],
  [/\bYT\s*PREM|\bYOUTUBE\s*PREM/i,                "YouTube Premium","Entertainment"],
  [/\bYOUTUBE\b/i,                                  "YouTube",        "Entertainment"],
  [/\bPRIME\s*VIDEO\b|\bPRIMEVIDEO\b/i,            "Prime Video",    "Entertainment"],
  [/\bHOTSTAR\b/i,                                  "Hotstar",        "Entertainment"],
  [/\bDISNEY[\s+]*PLUS\b|\bDISNEY\+\b/i,           "Disney+",        "Entertainment"],
  [/\bSONYLIV\b|\bSONY\s*LIV\b/i,                  "SonyLIV",        "Entertainment"],
  [/\bZEE5\b/i,                                     "ZEE5",           "Entertainment"],
  [/\bJIOCINEMA\b|\bJIO\s*CINEMA\b/i,               "JioCinema",      "Entertainment"],
  [/\bCRUNCHYROLL\b/i,                              "Crunchyroll",    "Entertainment"],
  [/\bTWITCH\b/i,                                   "Twitch",         "Entertainment"],
  [/\bMUBI\b/i,                                     "MUBI",           "Entertainment"],
  [/\bGAAN[A]?\b/i,                                 "Gaana",          "Entertainment"],
  [/\bJIOSAAVN\b|\bJIO\s*SAAVN\b/i,                "JioSaavn",       "Entertainment"],
  [/\bWYNK\b/i,                                     "Wynk",           "Entertainment"],
  [/\bAPPLE\s*MUSIC\b/i,                            "Apple Music",    "Entertainment"],
  [/\bAMAZON\s*MUSIC\b/i,                           "Amazon Music",   "Entertainment"],
  [/\bMXPLAYER\b|\bMX\s*PLAYER\b/i,                "MX Player",      "Entertainment"],

  // ── AI Tools ────────────────────────────────────────────────────────────────
  [/\bOPENAI\b|\bCHATGPT\b/i,                       "ChatGPT",        "AI Tools"],
  [/\bANTHROPIC\b|\bCLAUDE\b/i,                     "Claude",         "AI Tools"],
  [/\bMIDJOURNEY\b/i,                               "Midjourney",     "AI Tools"],
  [/\bGROK\b|\bXAI\b/i,                             "Grok",           "AI Tools"],
  [/\bGEMINI\b|\bGOOGLE\s*BARD\b/i,                "Gemini",         "AI Tools"],
  [/\bRUNWAY\b/i,                                   "Runway",         "AI Tools"],
  [/\bELEVEN\s*LABS\b/i,                            "ElevenLabs",     "AI Tools"],
  [/\bPERPLEXITY\b/i,                               "Perplexity",     "AI Tools"],

  // ── Developer Tools ──────────────────────────────────────────────────────────
  [/\bCURSOR\b/i,                                   "Cursor",         "Developer"],
  [/\bGITHUB\b|\bGH\s*COPILOT\b/i,                 "GitHub",         "Developer"],
  [/\bVERCEL\b/i,                                   "Vercel",         "Developer"],
  [/\bNETLIFY\b/i,                                  "Netlify",        "Developer"],
  [/\bRAILWAY\b/i,                                  "Railway",        "Developer"],
  [/\bDIGITALOCEAN\b|\bDO\s*OCEAN\b/i,             "DigitalOcean",   "Developer"],
  [/\bCLOUDFLARE\b/i,                               "Cloudflare",     "Developer"],
  [/\bAWS\b|\bAMAZON\s*WEB\b/i,                    "AWS",            "Developer"],
  [/\bGCP\b|\bGOOGLE\s*CLOUD\b/i,                  "Google Cloud",   "Developer"],
  [/\bAZURE\b|\bMICROSOFT\s*AZURE\b/i,             "Azure",          "Developer"],
  [/\bSUPABASE\b/i,                                 "Supabase",       "Developer"],
  [/\bATLASSIAN\b|\bJIRA\b|\bCONFLUENCE\b/i,       "Atlassian",      "Developer"],
  [/\bLINEAR\b/i,                                   "Linear",         "Developer"],
  [/\bSENTRY\b/i,                                   "Sentry",         "Developer"],
  [/\bJETBRAINS\b/i,                                "JetBrains",      "Developer"],
  [/\bPOSTMAN\b/i,                                  "Postman",        "Developer"],
  [/\bWARP\b/i,                                     "Warp",           "Developer"],
  [/\bRAYCAST\b/i,                                  "Raycast",        "Developer"],
  [/\bTWILIO\b/i,                                   "Twilio",         "Developer"],
  [/\bSENDGRID\b/i,                                 "SendGrid",       "Developer"],
  [/\bRESEND\b/i,                                   "Resend",         "Developer"],
  [/\bDATADOG\b/i,                                  "Datadog",        "Developer"],
  [/\bWEBFLOW\b/i,                                  "Webflow",        "Developer"],

  // ── Design ───────────────────────────────────────────────────────────────────
  [/\bADOBE\b/i,                                    "Adobe",          "Design"],
  [/\bFIGMA\b/i,                                    "Figma",          "Design"],
  [/\bCANVA\b/i,                                    "Canva",          "Design"],
  [/\bSKETCH\b/i,                                   "Sketch",         "Design"],
  [/\bFRAMER\b/i,                                   "Framer",         "Design"],

  // ── Productivity ─────────────────────────────────────────────────────────────
  [/\bNOTION\b/i,                                   "Notion",         "Productivity"],
  [/\bSLACK\b/i,                                    "Slack",          "Productivity"],
  [/\bZOOM\b/i,                                     "Zoom",           "Productivity"],
  [/\bLOOM\b/i,                                     "Loom",           "Productivity"],
  [/\bAIRTABLE\b/i,                                 "Airtable",       "Productivity"],
  [/\bCLICKUP\b/i,                                  "ClickUp",        "Productivity"],
  [/\bASANA\b/i,                                    "Asana",          "Productivity"],
  [/\bMONDAY\.COM\b|\bMONDAYCOM\b/i,               "Monday.com",     "Productivity"],
  [/\bGRAMMAR?LY\b/i,                              "Grammarly",      "Productivity"],
  [/\bTODOIST\b/i,                                  "Todoist",        "Productivity"],
  [/\bMICROSOFT\s*365\b|\bMS\s*365\b|\bOFFICE\s*365\b/i, "Microsoft 365", "Productivity"],
  [/\bMICROSOFT\b/i,                                "Microsoft",      "Productivity"],
  [/\bZOHO\b/i,                                     "Zoho",           "Productivity"],

  // ── Cloud Storage ─────────────────────────────────────────────────────────────
  [/\bICLOUD\b/i,                                   "iCloud",         "Cloud Storage"],
  [/\bGOOGLE\s*ONE\b|\bGOOGLE\s*STORAGE\b/i,       "Google One",     "Cloud Storage"],
  [/\bDROPBOX\b/i,                                  "Dropbox",        "Cloud Storage"],

  // ── Apple ──────────────────────────────────────────────────────────────────
  [/\bAPPLE\s*(SERVICES|SUBSCRIPTIONS|APP\s*STORE)\b|\bITUNES\b/i, "Apple Services", "Entertainment"],
  [/\bAPP\s*STORE\b/i,                              "Apple Services", "Entertainment"],

  // ── Google ─────────────────────────────────────────────────────────────────
  [/\bGOOGLE\s*PLAY\b|\bGOOGLEPLAY\b/i,            "Google Play",    "Entertainment"],
  [/\bGOOGLE\b/i,                                   "Google",         "Other"],

  // ── Amazon ──────────────────────────────────────────────────────────────────
  [/\bAMAZON\s*PRIME\b/i,                           "Prime Video",    "Entertainment"],
  [/\bAMAZON\b/i,                                   "Amazon",         "Shopping"],

  // ── Security / VPN ───────────────────────────────────────────────────────────
  [/\bNORDVPN\b/i,                                  "NordVPN",        "Security"],
  [/\bEXPRESSVPN\b/i,                               "ExpressVPN",     "Security"],
  [/\b1PASSWORD\b|\bONEPASSWORD\b/i,               "1Password",      "Security"],
  [/\bBITWARDEN\b/i,                                "Bitwarden",      "Security"],
  [/\bLASTPASS\b/i,                                 "LastPass",       "Security"],

  // ── Indian Telecom & Finance ─────────────────────────────────────────────────
  [/\bAIRTEL\b/i,                                   "Airtel",         "Telecom"],
  [/\bJIO\b/i,                                      "Jio",            "Telecom"],
  [/\bVI\b|\bVODAFONE\b|\bIDEA\b/i,                "Vi",             "Telecom"],
  [/\bBSNL\b/i,                                     "BSNL",           "Telecom"],
  [/\bZERODHA\b/i,                                  "Zerodha",        "Finance"],
  [/\bGROWW\b/i,                                    "Groww",          "Finance"],
  [/\bUPSTOX\b/i,                                   "Upstox",         "Finance"],
  [/\bANGEL\s*ONE\b|\bANGEL\s*BROKING\b/i,         "Angel One",      "Finance"],
  [/\bCLEARTAX\b/i,                                 "ClearTax",       "Finance"],

  // ── Food & Grocery subscriptions ────────────────────────────────────────────
  [/\bSWIGGY\s*ONE\b|\bSWIGGY\s*SUPER\b/i,         "Swiggy One",     "Food"],
  [/\bZOMATO\s*PRO\b|\bZOMATO\s*GOLD\b/i,          "Zomato Pro",     "Food"],

  // ── News & Publishing ────────────────────────────────────────────────────────
  [/\bTIMES\s*PRIME\b/i,                            "Times Prime",    "News"],
  [/\bTOI\b|\bTIMES\s*OF\s*INDIA\b/i,              "Times of India", "News"],
  [/\bECONOMIC\s*TIMES\b/i,                         "Economic Times", "News"],
  [/\bHINDU\b/i,                                    "The Hindu",      "News"],
  [/\bSUBSTACK\b/i,                                 "Substack",       "News"],
  [/\bNEWSLETTER\b/i,                               "Newsletter",     "News"],

  // ── Fitness / Health ─────────────────────────────────────────────────────────
  [/\bCULTFIT\b|\bCULT\.FIT\b/i,                   "Cult.fit",       "Health"],
  [/\bGOLD'?S?\s*GYM\b/i,                           "Gold's Gym",     "Health"],
  [/\bANYTIME\s*FITNESS\b/i,                        "Anytime Fitness","Health"],
  [/\bSTAVA\b|\bSTRAVA\b/i,                         "Strava",         "Health"],
];

// ─── Main normalization function ─────────────────────────────────────────────

export function normalizeMerchant(rawDescription: string): NormalizedMerchant {
  const paymentMethod = detectPaymentMethod(rawDescription);
  const isStandingInstruction = paymentMethod === "NACH" || paymentMethod === "ECS" || paymentMethod === "SI";

  // Try to extract a cleaner merchant segment based on payment method
  let candidate = rawDescription;
  if (paymentMethod === "UPI") {
    candidate = extractFromUPI(rawDescription) ?? rawDescription;
  } else if (paymentMethod === "NACH") {
    candidate = extractFromNACH(rawDescription) ?? rawDescription;
  } else if (paymentMethod === "ECS") {
    candidate = extractFromECS(rawDescription) ?? rawDescription;
  }

  // Strip common noise from the candidate
  const cleaned = candidate
    .replace(/\b\d{6,}\b/g, "")       // long reference numbers
    .replace(/\b[A-Z]{2}\d{10,}\b/g, "") // UTRN-style refs
    .replace(/[\/\-_]\s*$/, "")        // trailing separators
    .replace(/\s{2,}/g, " ")
    .trim();

  // Match against the pattern table
  for (const [pattern, name, category] of MERCHANT_PATTERNS) {
    if (pattern.test(cleaned) || pattern.test(rawDescription)) {
      return {
        name,
        category,
        confidence: isStandingInstruction ? 0.95 : 0.85,
        paymentMethod,
        isStandingInstruction,
      };
    }
  }

  // Fallback: use cleaned candidate as the merchant name (low confidence)
  const fallbackName = cleaned.length > 2 ? toTitleCase(cleaned.slice(0, 40)) : rawDescription.slice(0, 40);

  return {
    name: fallbackName,
    category: "Other",
    confidence: isStandingInstruction ? 0.7 : 0.3,
    paymentMethod,
    isStandingInstruction,
  };
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
