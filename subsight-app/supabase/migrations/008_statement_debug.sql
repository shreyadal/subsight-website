-- ─── Extend uploaded_statements for debug mode and recurring stats ─────────────

-- Stores raw parsed rows as JSONB for the debug panel in the Uploads UI
ALTER TABLE public.uploaded_statements
  ADD COLUMN IF NOT EXISTS debug_rows JSONB;

-- Count of recurring subscriptions detected from this statement
ALTER TABLE public.uploaded_statements
  ADD COLUMN IF NOT EXISTS recurring_found INTEGER NOT NULL DEFAULT 0;

-- Source label shown in the UI (e.g. "HDFC •• 4421")
ALTER TABLE public.uploaded_statements
  ADD COLUMN IF NOT EXISTS source_label TEXT;
