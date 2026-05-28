-- ─── Add syncing state to gmail_connections ───────────────────────────────────
-- Allows the sync orchestrator to mark a connection as actively syncing,
-- preventing concurrent sync runs from the same user.

-- Drop the existing status check so we can expand the allowed values
ALTER TABLE public.gmail_connections
  DROP CONSTRAINT IF EXISTS gmail_connections_status_check;

-- Re-add with 'syncing' included
ALTER TABLE public.gmail_connections
  ADD CONSTRAINT gmail_connections_status_check
    CHECK (status IN ('active', 'syncing', 'disconnected', 'error'));

-- Track when the current sync job started so we can detect stuck jobs
-- (e.g. process crash while status was 'syncing')
ALTER TABLE public.gmail_connections
  ADD COLUMN IF NOT EXISTS last_sync_started_at TIMESTAMPTZ;

-- Track how many AI normalizer calls were made (for observability)
ALTER TABLE public.gmail_connections
  ADD COLUMN IF NOT EXISTS ai_calls_made INTEGER NOT NULL DEFAULT 0;
