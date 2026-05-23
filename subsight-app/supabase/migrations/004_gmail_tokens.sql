-- ─── Add token storage to gmail_connections ───────────────────────────────────

ALTER TABLE public.gmail_connections
  ADD COLUMN IF NOT EXISTS access_token  TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS emails_scanned INTEGER NOT NULL DEFAULT 0;

-- One Gmail connection per Supabase user
ALTER TABLE public.gmail_connections
  DROP CONSTRAINT IF EXISTS gmail_connections_user_id_unique;
ALTER TABLE public.gmail_connections
  ADD CONSTRAINT gmail_connections_user_id_unique UNIQUE (user_id);

-- ─── gmail_email_log ──────────────────────────────────────────────────────────
-- Stores each billing email parsed during a sync run.
-- gmail_message_id is globally unique per-user (Google never reuses message IDs).

CREATE TABLE IF NOT EXISTS public.gmail_email_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id TEXT        NOT NULL,
  from_address     TEXT        NOT NULL,
  subject          TEXT        NOT NULL,
  merchant_name    TEXT        NOT NULL,
  amount_inr       INTEGER,
  email_date       DATE        NOT NULL,
  -- subscription | invoice | trial | renewal
  tag              TEXT        NOT NULL DEFAULT 'subscription',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, gmail_message_id)
);

ALTER TABLE public.gmail_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gmail_email_log"
  ON public.gmail_email_log FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gmail_email_log_user_id
  ON public.gmail_email_log (user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_email_log_email_date
  ON public.gmail_email_log (email_date DESC);
