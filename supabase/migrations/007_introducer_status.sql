-- ================================================================
-- 007_introducer_status.sql
-- Adds status column to profiles so introducers can be made dormant
-- ================================================================

CREATE TYPE profile_status AS ENUM ('active', 'dormant');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status profile_status NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

COMMENT ON COLUMN public.profiles.status IS
  'active = normal access; dormant = portal access blocked (soft disable)';
