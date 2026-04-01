-- ============================================================
-- Migration 013: Commission Tracking
--
-- Adds an invoice-based commission table for tracking
-- introducer revenue share payments. Each record covers one
-- billing period for one investor account.
--
-- Status flow:
--   pending → invoice_requested → invoice_received → paid
--                           ↘                  ↘
--                           cancelled         cancelled
-- ============================================================

-- Status enum
CREATE TYPE commission_status AS ENUM (
  'pending',
  'invoice_requested',
  'invoice_received',
  'paid',
  'cancelled'
);

-- Core table
CREATE TABLE commissions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id          uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  introducer_id        uuid NOT NULL REFERENCES profiles(id),
  period_label         text NOT NULL,          -- e.g. "March 2025" or "Q1 2025"
  amount_gbp           numeric(12,2) NOT NULL CHECK (amount_gbp > 0),
  performance_fee_gbp  numeric(12,2),          -- gross perf. fee this is derived from (optional)
  commission_rate      numeric(5,4),           -- e.g. 0.15 for 15% (optional, informational)
  status               commission_status NOT NULL DEFAULT 'pending',
  invoice_requested_at timestamptz,
  invoice_received_at  timestamptz,
  paid_at              timestamptz,
  notes                text,
  created_by           uuid REFERENCES profiles(id),
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX commissions_investor_id_idx   ON commissions(investor_id);
CREATE INDEX commissions_introducer_id_idx ON commissions(introducer_id);
CREATE INDEX commissions_status_idx        ON commissions(status);
CREATE INDEX commissions_created_at_idx    ON commissions(created_at DESC);

-- Row-Level Security
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admin full access to commissions"
  ON commissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Introducers may read only their own commissions
CREATE POLICY "Introducers read own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (introducer_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
