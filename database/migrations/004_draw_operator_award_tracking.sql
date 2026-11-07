ALTER TABLE winners
  ADD COLUMN IF NOT EXISTS responsible_user_id BIGINT REFERENCES users(user_id),
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS awarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_winners_responsible
  ON winners(responsible_user_id);
