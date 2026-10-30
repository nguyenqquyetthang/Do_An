-- Program approval workflow and account moderation.
ALTER TABLE lottery_programs
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(user_id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE lottery_programs DROP CONSTRAINT IF EXISTS ck_program_status;
ALTER TABLE lottery_programs ADD CONSTRAINT ck_program_status CHECK (
  status IN (
    'draft', 'pending_review', 'rejected', 'upcoming', 'active', 'ended',
    'published', 'closed', 'drawing', 'completed', 'cancelled'
  )
);

CREATE INDEX IF NOT EXISTS idx_programs_status ON lottery_programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_created_by ON lottery_programs(created_by);
