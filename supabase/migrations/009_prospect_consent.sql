-- ============================================================
-- Migration 009: Prospect Consent Flow
-- Adds pending_consent status and consent-tracking columns.
-- Cooling-off now starts only AFTER the prospect explicitly
-- confirms their interest via the emailed consent link.
-- ============================================================

-- Add new status value (must come before cooling_off)
ALTER TYPE public.prospect_status ADD VALUE IF NOT EXISTS 'pending_consent' BEFORE 'cooling_off';

-- Add consent tracking columns
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS consent_token    uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS consent_signed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS consent_ip_address  text,
  ADD COLUMN IF NOT EXISTS consent_pdf_path    text;

-- Ensure all existing rows have a consent_token
UPDATE public.prospects
SET consent_token = gen_random_uuid()
WHERE consent_token IS NULL;

-- Change the column default so new prospects start as pending_consent
ALTER TABLE public.prospects
  ALTER COLUMN status SET DEFAULT 'pending_consent';

-- Storage bucket for prospect consent PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prospect-consents',
  'prospect-consents',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: service role handles all access (bypasses RLS)
-- Admins can read any consent PDF
CREATE POLICY "admin_read_prospect_consents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'prospect-consents' AND
    get_user_role() = 'admin'
  );
