-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- One row per auth user. Created automatically via trigger on signup.

CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  login_method TEXT       NOT NULL DEFAULT 'email',  -- 'email' | 'google'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── onboarding_state ─────────────────────────────────────────────────────────

CREATE TABLE public.onboarding_state (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  step          INTEGER     NOT NULL DEFAULT 1,
  bank_connected  BOOLEAN   NOT NULL DEFAULT FALSE,
  gmail_connected BOOLEAN   NOT NULL DEFAULT FALSE,
  source        TEXT,                                -- 'bank' | 'upload'
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.onboarding_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding: select own"
  ON public.onboarding_state FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "onboarding: insert own"
  ON public.onboarding_state FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "onboarding: update own"
  ON public.onboarding_state FOR UPDATE
  USING (auth.uid() = id);

-- ─── Trigger: create profile + onboarding row on signup ───────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, login_method)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    CASE
      WHEN NEW.app_metadata ->> 'provider' = 'google' THEN 'google'
      ELSE 'email'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.onboarding_state (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Trigger: auto-update profiles.updated_at ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
