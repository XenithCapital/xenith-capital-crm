-- ============================================================
-- Xenith Capital CRM — Initial Schema Migration
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'introducer');
CREATE TYPE introducer_tier AS ENUM ('tier_1', 'tier_2', 'tier_3');
CREATE TYPE prospect_status AS ENUM (
  'registered',
  'cooling_off',
  'cooling_off_complete',
  'education_sent',
  'handoff_pending',
  'handed_off',
  'onboarding',
  'funded',
  'active',
  'stalled',
  'lost',
  'rejected'
);
CREATE TYPE investor_status AS ENUM ('active', 'inactive', 'withdrawn', 'suspended');
CREATE TYPE referral_reward_status AS ENUM ('pending', 'vested', 'paid', 'forfeited');
CREATE TYPE investor_strategy AS ENUM ('XQS', 'XNS', 'XXS');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- ============================================================
-- TABLES
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role             user_role NOT NULL DEFAULT 'introducer',
  full_name        text NOT NULL,
  email            text NOT NULL,
  phone            text,
  company_name     text,
  linkedin_url     text,
  agreement_signed boolean NOT NULL DEFAULT false,
  tier             introducer_tier NOT NULL DEFAULT 'tier_1',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- agreements
CREATE TABLE public.agreements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  introducer_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signed_at         timestamptz NOT NULL,
  ip_address        text NOT NULL,
  full_name_typed   text NOT NULL,
  agreement_version text NOT NULL DEFAULT 'V2_March_2026',
  pdf_storage_path  text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- prospects
CREATE TABLE public.prospects (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  introducer_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name                text NOT NULL,
  email                    text NOT NULL,
  phone                    text,
  country                  text,
  source_note              text,
  status                   prospect_status NOT NULL DEFAULT 'cooling_off',
  cooling_off_started_at   timestamptz,
  cooling_off_completed_at timestamptz,
  notes                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- prospect_status_history
CREATE TABLE public.prospect_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  changed_by  uuid NOT NULL REFERENCES public.profiles(id),
  old_status  text,
  new_status  text NOT NULL,
  note        text,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

-- investors
CREATE TABLE public.investors (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id              uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  introducer_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name                text NOT NULL,
  email                    text NOT NULL,
  phone                    text,
  vantage_account_number   text,
  strategy                 investor_strategy,
  account_type             text,
  funded_amount_usd        numeric(12,2),
  status                   investor_status NOT NULL DEFAULT 'active',
  funded_at                timestamptz,
  vesting_start_date       timestamptz,
  vesting_end_date         timestamptz,
  referral_reward_status   referral_reward_status NOT NULL DEFAULT 'pending',
  high_water_mark          numeric(12,2),
  notes                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- support_tickets
CREATE TABLE public.support_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raised_by      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject        text NOT NULL,
  body           text NOT NULL,
  status         ticket_status NOT NULL DEFAULT 'open',
  priority       ticket_priority NOT NULL DEFAULT 'normal',
  admin_response text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- audit_log
CREATE TABLE public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid NOT NULL REFERENCES public.profiles(id),
  action      text NOT NULL,
  target_type text,
  target_id   uuid,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_prospects_introducer_id ON public.prospects(introducer_id);
CREATE INDEX idx_prospects_status ON public.prospects(status);
CREATE INDEX idx_prospects_cooling_off ON public.prospects(status, cooling_off_completed_at)
  WHERE status = 'cooling_off';
CREATE INDEX idx_investors_introducer_id ON public.investors(introducer_id);
CREATE INDEX idx_investors_status ON public.investors(status);
CREATE INDEX idx_tickets_raised_by ON public.support_tickets(raised_by);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_target ON public.audit_log(target_id);
CREATE INDEX idx_status_history_prospect ON public.prospect_status_history(prospect_id);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investors_updated_at
  BEFORE UPDATE ON public.investors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'introducer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Auto-set cooling-off timestamps on prospect insert
-- ============================================================

CREATE OR REPLACE FUNCTION set_cooling_off_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cooling_off' AND NEW.cooling_off_started_at IS NULL THEN
    NEW.cooling_off_started_at = now();
    NEW.cooling_off_completed_at = now() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_prospect_cooling_off
  BEFORE INSERT ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION set_cooling_off_timestamps();

-- ============================================================
-- STORAGE: Private bucket for introducer agreements
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'introducer-agreements',
  'introducer-agreements',
  false,
  10485760,  -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;
