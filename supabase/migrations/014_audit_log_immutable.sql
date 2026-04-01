-- ============================================================
-- Migration 014: Audit Log Immutability
--
-- Adds a BEFORE UPDATE and BEFORE DELETE trigger on audit_log
-- that unconditionally raises an exception — even for the
-- service role / superuser. Once a row is written it cannot
-- be changed or removed by any means short of a superuser
-- dropping the trigger itself, which would be visible in the
-- Supabase dashboard audit trail.
-- ============================================================

CREATE OR REPLACE FUNCTION audit_log_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION
    'audit_log is append-only — UPDATE and DELETE are not permitted (row id: %)', OLD.id;
END;
$$;

-- Block UPDATE
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

-- Block DELETE
CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
