-- ================================================================
-- 006_investor_allocations.sql
-- Multi-strategy support: investor_allocations table
-- Strategy column changed from enum to text (more flexible)
-- ================================================================

-- 1. Change investors.strategy from enum to text
ALTER TABLE public.investors ALTER COLUMN strategy TYPE text;

-- 2. Drop the old restrictive enum (no longer needed)
DROP TYPE IF EXISTS investor_strategy;

-- 3. Create investor_allocations table
CREATE TABLE IF NOT EXISTS public.investor_allocations (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id           uuid        NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  strategy              text        NOT NULL,
  funded_amount_usd     numeric,
  funded_at             date,
  account_number        text,
  account_type          text,
  vesting_start_date    timestamptz,
  vesting_end_date      timestamptz,
  referral_reward_status text        NOT NULL DEFAULT 'pending',
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.investor_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_allocations" ON public.investor_allocations;
CREATE POLICY "admins_manage_allocations" ON public.investor_allocations
  FOR ALL
  USING    (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "introducers_view_own_allocations" ON public.investor_allocations;
CREATE POLICY "introducers_view_own_allocations" ON public.investor_allocations
  FOR SELECT
  USING (
    get_user_role() = 'introducer' AND
    EXISTS (
      SELECT 1 FROM public.investors i
      WHERE i.id = investor_allocations.investor_id
        AND i.introducer_id = auth.uid()
    )
  );
