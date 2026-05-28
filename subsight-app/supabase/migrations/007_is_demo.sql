-- ─── Mark demo/seeded rows so they can be cleaned up on first real sync ────────
--
-- During onboarding, seedDemoData() populates these tables with fictional data
-- so the dashboard looks populated before the user connects real sources.
-- When the user runs their first Gmail sync, all is_demo = true rows are deleted
-- before any real-data inserts, ensuring no demo rows bleed into production views.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.ai_insights
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- Index for fast bulk-delete of demo rows during Gmail sync
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_demo ON public.subscriptions(user_id, is_demo)
  WHERE is_demo = true;

CREATE INDEX IF NOT EXISTS idx_transactions_is_demo ON public.transactions(user_id, is_demo)
  WHERE is_demo = true;

CREATE INDEX IF NOT EXISTS idx_ai_insights_is_demo ON public.ai_insights(user_id, is_demo)
  WHERE is_demo = true;
