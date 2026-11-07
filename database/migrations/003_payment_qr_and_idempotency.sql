-- Migration 003: Payment QR, Idempotency and Transaction Logging
ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120) UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Idempotency tracking table
CREATE TABLE IF NOT EXISTS idempotency_records (
    idempotency_key VARCHAR(120) PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    endpoint VARCHAR(200) NOT NULL,
    order_id BIGINT REFERENCES orders(order_id) ON DELETE CASCADE,
    response_code INTEGER NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_idempotency_key_user ON idempotency_records(idempotency_key, user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
