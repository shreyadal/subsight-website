-- ─── Extend profiles ──────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- ─── Extend onboarding_state ──────────────────────────────────────────────────

ALTER TABLE onboarding_state
  ADD COLUMN IF NOT EXISTS has_connected_bank BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_uploaded_statement BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_connected_gmail BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS source TEXT;

-- ─── bank_connections ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number_last4 TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'savings',
  kind TEXT NOT NULL DEFAULT 'Savings',
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'reconnect', 'error')),
  color TEXT NOT NULL DEFAULT 'oklch(0.30 0.10 250)',
  setu_consent_id TEXT,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bank_connections"
  ON bank_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);

CREATE TRIGGER set_bank_connections_updated_at
  BEFORE UPDATE ON bank_connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── uploaded_statements ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uploaded_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'done', 'error')),
  bank_name TEXT,
  period_from DATE,
  period_to DATE,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE uploaded_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own uploaded_statements"
  ON uploaded_statements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_uploaded_statements_user_id ON uploaded_statements(user_id);

CREATE TRIGGER set_uploaded_statements_updated_at
  BEFORE UPDATE ON uploaded_statements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── subscriptions ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_connection_id UUID REFERENCES bank_connections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  cycle TEXT NOT NULL DEFAULT 'mo' CHECK (cycle IN ('mo', 'yr')),
  category TEXT NOT NULL DEFAULT 'Other',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  detected_by TEXT NOT NULL DEFAULT 'bank' CHECK (detected_by IN ('bank', 'gmail', 'manual')),
  confidence NUMERIC(4,3) NOT NULL DEFAULT 1.0,
  next_renewal_date DATE,
  renew_label TEXT NOT NULL DEFAULT '',
  source_label TEXT NOT NULL DEFAULT '',
  ai_tag TEXT,
  ai_insight TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_bank_connection_id ON subscriptions(bank_connection_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── transactions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  bank_connection_id UUID REFERENCES bank_connections(id) ON DELETE SET NULL,
  merchant TEXT NOT NULL,
  norm TEXT NOT NULL DEFAULT '',
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  type TEXT NOT NULL DEFAULT 'debit' CHECK (type IN ('debit', 'credit')),
  category TEXT NOT NULL DEFAULT 'Other',
  account_label TEXT NOT NULL DEFAULT '',
  recurring_confidence NUMERIC(4,3) NOT NULL DEFAULT 0.0,
  transacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_connection_id ON transactions(bank_connection_id);
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id ON transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transacted_at ON transactions(transacted_at DESC);

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ai_insights ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'savings' CHECK (kind IN ('savings', 'duplicate', 'overlap', 'underused', 'trial', 'yearly')),
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'mo',
  body TEXT NOT NULL DEFAULT '',
  action_label TEXT NOT NULL DEFAULT '',
  services TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'dismissed')),
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ai_insights"
  ON ai_insights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);

CREATE TRIGGER set_ai_insights_updated_at
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
