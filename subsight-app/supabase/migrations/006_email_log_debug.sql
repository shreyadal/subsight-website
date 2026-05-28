-- ─── Add debug columns to gmail_email_log ─────────────────────────────────────
-- Stores which detection layer matched each email and the confidence score.
-- These power the debug panel in the Gmail Sync UI.

ALTER TABLE public.gmail_email_log
  ADD COLUMN IF NOT EXISTS confidence  NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS detected_by TEXT
    CHECK (detected_by IN ('domain', 'processor', 'keyword', 'ai', 'heuristic'));
