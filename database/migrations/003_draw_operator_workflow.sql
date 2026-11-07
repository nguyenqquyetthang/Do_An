-- Separate draw execution from program ownership.
INSERT INTO roles (role_name, description)
VALUES ('DRAW_OPERATOR', 'Thực hiện quay thưởng và theo dõi trao giải')
ON CONFLICT (role_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS program_draw_operators (
    assignment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES lottery_programs(program_id) ON DELETE CASCADE,
    operator_user_id BIGINT NOT NULL REFERENCES users(user_id),
    assigned_by BIGINT NOT NULL REFERENCES users(user_id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (program_id, operator_user_id)
);

ALTER TABLE winners DROP CONSTRAINT IF EXISTS ck_winner_claim_status;
ALTER TABLE winners ADD CONSTRAINT ck_winner_claim_status CHECK (
    claim_status IN (
        'pending', 'contacted', 'verified', 'processing',
        'awarded', 'failed', 'disputed', 'rejected'
    )
);

CREATE INDEX IF NOT EXISTS idx_draw_operator_program
    ON program_draw_operators(program_id);

CREATE INDEX IF NOT EXISTS idx_draw_operator_user
    ON program_draw_operators(operator_user_id);
