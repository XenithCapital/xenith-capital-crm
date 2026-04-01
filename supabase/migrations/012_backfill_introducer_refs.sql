-- ============================================================
-- Migration 012: Backfill Introducer Reference Numbers
--
-- Assigns a ref number (via the assign_introducer_ref function
-- from migration 011) to any external introducer who has already
-- signed their agreement but was onboarded before 011 ran.
--
-- Internal team members (is_internal = true) are excluded —
-- their refs were pre-assigned in 011 (XC-100 to XC-102).
--
-- Safe to run multiple times — assign_introducer_ref is idempotent
-- and skips anyone who already has a ref.
-- ============================================================

DO $$
DECLARE
  rec RECORD;
  assigned_ref text;
  counter integer := 0;
BEGIN
  FOR rec IN
    SELECT id, full_name, email
      FROM public.profiles
     WHERE role = 'introducer'
       AND is_internal = false
       AND agreement_signed = true
       AND introducer_ref IS NULL
     ORDER BY created_at ASC          -- oldest first = lowest ref numbers
  LOOP
    assigned_ref := public.assign_introducer_ref(rec.id);
    counter := counter + 1;
    RAISE NOTICE 'Assigned % to % (%)', assigned_ref, rec.full_name, rec.email;
  END LOOP;

  RAISE NOTICE 'Backfill complete — % introducer(s) assigned a reference number.', counter;
END;
$$;
