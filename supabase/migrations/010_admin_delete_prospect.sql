-- Migration 010: Allow admins to delete prospects and related records

-- Prospects
CREATE POLICY "admin_delete_prospects" ON public.prospects
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- Related tables (cascade-style — admin can clean these up too)
CREATE POLICY "admin_delete_prospect_status_history" ON public.prospect_status_history
  FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');
