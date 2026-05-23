-- ─── gmail_connections ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gmail_connections (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT        NOT NULL,
  status               TEXT        NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'disconnected', 'error')),
  subscriptions_detected INTEGER   NOT NULL DEFAULT 0,
  trials_detected      INTEGER     NOT NULL DEFAULT 0,
  last_synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own gmail_connections"
  ON public.gmail_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gmail_connections_user_id
  ON public.gmail_connections(user_id);

CREATE TRIGGER set_gmail_connections_updated_at
  BEFORE UPDATE ON public.gmail_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
