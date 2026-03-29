-- ============================================================
-- Xenith Capital CRM — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- ============================================================

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_profiles_all" ON public.profiles
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- Introducer: own row only
CREATE POLICY "introducer_profiles_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "introducer_profiles_own_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- agreements
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_agreements_all" ON public.agreements
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- Introducer: own record only
CREATE POLICY "introducer_agreements_own" ON public.agreements
  FOR SELECT TO authenticated
  USING (introducer_id = auth.uid());

CREATE POLICY "introducer_agreements_insert" ON public.agreements
  FOR INSERT TO authenticated
  WITH CHECK (introducer_id = auth.uid());

-- ============================================================
-- prospects
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_prospects_all" ON public.prospects
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- Introducer: own prospects only
CREATE POLICY "introducer_prospects_select" ON public.prospects
  FOR SELECT TO authenticated
  USING (introducer_id = auth.uid());

CREATE POLICY "introducer_prospects_insert" ON public.prospects
  FOR INSERT TO authenticated
  WITH CHECK (introducer_id = auth.uid());

CREATE POLICY "introducer_prospects_update" ON public.prospects
  FOR UPDATE TO authenticated
  USING (introducer_id = auth.uid())
  WITH CHECK (introducer_id = auth.uid());

-- ============================================================
-- prospect_status_history
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_psh_all" ON public.prospect_status_history
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- Introducer: can view history for own prospects
CREATE POLICY "introducer_psh_select" ON public.prospect_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects p
      WHERE p.id = prospect_id AND p.introducer_id = auth.uid()
    )
  );

-- ============================================================
-- investors
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_investors_all" ON public.investors
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- Introducer: read own investors
CREATE POLICY "introducer_investors_select" ON public.investors
  FOR SELECT TO authenticated
  USING (introducer_id = auth.uid());

-- ============================================================
-- support_tickets
-- ============================================================

-- Admin: full access
CREATE POLICY "admin_tickets_all" ON public.support_tickets
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- Introducer: own tickets, cannot delete
CREATE POLICY "introducer_tickets_select" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (raised_by = auth.uid());

CREATE POLICY "introducer_tickets_insert" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (raised_by = auth.uid());

-- ============================================================
-- audit_log
-- ============================================================

-- Admin only: read all
CREATE POLICY "admin_audit_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

-- Service role (server-side) can insert audit logs
-- This is handled by service role key bypassing RLS

-- ============================================================
-- Storage: introducer-agreements bucket
-- ============================================================

-- Authenticated users can upload to their own folder
CREATE POLICY "users_upload_own_agreements" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'introducer-agreements' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read their own agreements
CREATE POLICY "users_read_own_agreements" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'introducer-agreements' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      get_user_role() = 'admin'
    )
  );

-- Service role can do anything (bypasses RLS)
