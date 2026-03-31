-- ============================================================
-- Migration 008: Agreement Version Tracking
-- Adds signed_agreement_version to profiles so the portal can
-- gate access when a new agreement version is required.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signed_agreement_version text;

-- Backfill: all currently-signed introducers are on V2_March_2026
UPDATE public.profiles
SET signed_agreement_version = 'V2_March_2026'
WHERE agreement_signed = true
  AND signed_agreement_version IS NULL;
