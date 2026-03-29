-- ================================================================
-- 005_enhancements.sql
-- Internal introducers, app settings, document library
-- ================================================================

-- 1. Add is_internal flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

-- 2. Drop the FK constraint so we can create internal profiles
--    that don't need Supabase auth accounts
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Seed internal Xenith Capital team members
INSERT INTO public.profiles (id, email, full_name, role, agreement_signed, is_internal, tier)
VALUES
  (gen_random_uuid(), 'szymon.wloch@xenithcapital.co.uk',  'Szymon Wloch (XC)',  'introducer', true, true, 'tier_1'),
  (gen_random_uuid(), 'rapten@xenithcapital.co.uk',         'Rapten (XC)',         'introducer', true, true, 'tier_1'),
  (gen_random_uuid(), 'lukasz@xenithcapital.co.uk',         'Lukasz (XC)',         'introducer', true, true, 'tier_1')
ON CONFLICT (email) DO NOTHING;

-- 4. App settings table (key-value store for admin-editable config)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key         text        PRIMARY KEY,
  value       text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid
);

INSERT INTO public.app_settings (key, value)
VALUES ('agreement_version', 'V2_March_2026')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_settings" ON public.app_settings;
CREATE POLICY "admins_manage_settings" ON public.app_settings
  USING    (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- 5. Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id                         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name                       text        NOT NULL,
  description                text,
  category                   text        NOT NULL DEFAULT 'general',
  file_path                  text        NOT NULL,
  file_size                  bigint,
  mime_type                  text,
  visible_to_introducers     boolean     NOT NULL DEFAULT false,
  uploaded_by                uuid,
  created_at                 timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_manage_documents" ON public.documents;
CREATE POLICY "admins_manage_documents" ON public.documents
  FOR ALL
  USING    (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "introducers_view_documents" ON public.documents;
CREATE POLICY "introducers_view_documents" ON public.documents
  FOR SELECT
  USING (get_user_role() = 'introducer' AND visible_to_introducers = true);

-- 6. Documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
DROP POLICY IF EXISTS "admins_manage_documents_storage" ON storage.objects;
CREATE POLICY "admins_manage_documents_storage" ON storage.objects
  FOR ALL
  USING    (bucket_id = 'documents' AND get_user_role() = 'admin')
  WITH CHECK (bucket_id = 'documents' AND get_user_role() = 'admin');

DROP POLICY IF EXISTS "introducers_read_documents_storage" ON storage.objects;
CREATE POLICY "introducers_read_documents_storage" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents' AND get_user_role() = 'introducer');
