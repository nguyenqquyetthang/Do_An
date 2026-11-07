ALTER TABLE lottery_programs DROP CONSTRAINT IF EXISTS ck_program_status;
ALTER TABLE lottery_programs ADD CONSTRAINT ck_program_status CHECK (
  status IN (
    'draft', 'pending_review', 'rejected', 'upcoming', 'active',
    'ended', 'published', 'closed', 'drawing', 'completed', 'cancelled', 'suspended'
  )
);
