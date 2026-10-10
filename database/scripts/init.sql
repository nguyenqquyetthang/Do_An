-- Lottery Distribution database schema
-- Create the database separately, then run this file while connected to it:
--   CREATE DATABASE lottery_distribution;
--
-- This file intentionally does not contain database credentials.

-- 1. ROLES
CREATE TABLE roles (
    role_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_roles_name
        CHECK (LENGTH(TRIM(role_name)) > 0)
);

-- 2. USERS
CREATE TABLE users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(role_id),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_users_status
        CHECK (status IN ('active', 'inactive', 'locked')),
    CONSTRAINT ck_users_username
        CHECK (LENGTH(TRIM(username)) > 0)
);

-- 3. LOTTERY_PROGRAMS
CREATE TABLE lottery_programs (
    program_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_by BIGINT NOT NULL REFERENCES users(user_id),
    program_code VARCHAR(50) NOT NULL UNIQUE,
    program_name VARCHAR(200) NOT NULL,
    description TEXT,
    rules TEXT,
    ticket_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_tickets INTEGER NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    draw_time TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_program_price CHECK (ticket_price >= 0),
    CONSTRAINT ck_program_tickets CHECK (total_tickets > 0),
    CONSTRAINT ck_program_dates CHECK (
        start_time IS NULL OR end_time IS NULL
        OR start_time < end_time
    ),
    CONSTRAINT ck_program_status CHECK (
        status IN (
            'draft', 'published', 'closed',
            'drawing', 'completed', 'cancelled'
        )
    )
);

-- 4. PRIZES
CREATE TABLE prizes (
    prize_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_id BIGINT NOT NULL
        REFERENCES lottery_programs(program_id),
    prize_name VARCHAR(200) NOT NULL,
    prize_type VARCHAR(50) NOT NULL,
    description TEXT,
    asset_details JSONB NOT NULL DEFAULT '{}'::JSONB,
    estimated_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_prize_value CHECK (estimated_value >= 0),
    CONSTRAINT ck_prize_quantity CHECK (quantity > 0)
);

-- 5. LOTTERY_TICKETS
CREATE TABLE lottery_tickets (
    ticket_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_id BIGINT NOT NULL
        REFERENCES lottery_programs(program_id),
    ticket_number VARCHAR(30) NOT NULL,
    price NUMERIC(18,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    held_by BIGINT REFERENCES users(user_id),
    held_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ticket_number
        UNIQUE (program_id, ticket_number),
    CONSTRAINT ck_ticket_price CHECK (price >= 0),
    CONSTRAINT ck_ticket_status CHECK (
        status IN ('available', 'held', 'sold', 'void')
    ),
    CONSTRAINT ck_ticket_hold CHECK (
        (status = 'held' AND held_by IS NOT NULL
         AND held_until IS NOT NULL)
        OR
        (status <> 'held' AND held_by IS NULL
         AND held_until IS NULL)
    )
);

-- 6. ORDERS
CREATE TABLE orders (
    order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    order_code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_order_amount CHECK (total_amount >= 0),
    CONSTRAINT ck_order_status CHECK (
        status IN (
            'pending', 'confirmed', 'cancelled',
            'expired', 'refunded'
        )
    )
);

-- 7. ORDER_ITEMS
CREATE TABLE order_items (
    order_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    ticket_id BIGINT NOT NULL REFERENCES lottery_tickets(ticket_id),
    unit_price NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_order_ticket UNIQUE (order_id, ticket_id),
    CONSTRAINT ck_order_item_price CHECK (unit_price >= 0)
);

-- 8. PAYMENTS
CREATE TABLE payments (
    payment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    payment_code VARCHAR(60) NOT NULL UNIQUE,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'simulation',
    amount NUMERIC(18,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    transaction_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_payment_amount CHECK (amount >= 0),
    CONSTRAINT ck_payment_status CHECK (
        status IN ('pending', 'success', 'failed', 'refunded')
    ),
    CONSTRAINT ck_payment_simulated CHECK (is_simulated = TRUE)
);

-- 9. DRAWS
CREATE TABLE draws (
    draw_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES lottery_programs(program_id),
    executed_by BIGINT REFERENCES users(user_id),
    draw_code VARCHAR(60) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    algorithm_version VARCHAR(100),
    seed_commitment CHAR(64),
    revealed_seed TEXT,
    result_hash CHAR(64),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_draw_status CHECK (
        status IN ('scheduled', 'running', 'completed', 'failed')
    ),
    CONSTRAINT ck_draw_times CHECK (
        completed_at IS NULL OR started_at IS NULL
        OR completed_at >= started_at
    ),
    CONSTRAINT uq_draw_program UNIQUE (draw_id, program_id)
);

-- 10. DRAW_RESULTS
CREATE TABLE draw_results (
    result_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    draw_id BIGINT NOT NULL,
    program_id BIGINT NOT NULL,
    ticket_id BIGINT NOT NULL REFERENCES lottery_tickets(ticket_id),
    prize_id BIGINT REFERENCES prizes(prize_id),
    result_rank INTEGER,
    is_winner BOOLEAN NOT NULL DEFAULT TRUE,
    verification_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_result_draw_program
        FOREIGN KEY (draw_id, program_id)
        REFERENCES draws(draw_id, program_id),
    CONSTRAINT uq_draw_result_ticket UNIQUE (draw_id, ticket_id),
    CONSTRAINT ck_result_rank CHECK (
        result_rank IS NULL OR result_rank > 0
    ),
    CONSTRAINT ck_result_prize CHECK (
        (is_winner = TRUE AND prize_id IS NOT NULL)
        OR
        (is_winner = FALSE AND prize_id IS NULL)
    )
);

-- 11. WINNERS
CREATE TABLE winners (
    winner_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    result_id BIGINT NOT NULL UNIQUE
        REFERENCES draw_results(result_id),
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    claim_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    won_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMPTZ,
    notes TEXT,
    CONSTRAINT ck_winner_claim_status CHECK (
        claim_status IN (
            'pending', 'contacted', 'verified',
            'awarded', 'rejected'
        )
    )
);

-- 12. AUDIT_LOGS
CREATE TABLE audit_logs (
    audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(user_id)
        ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role
    ON users(role_id);

CREATE INDEX idx_programs_status
    ON lottery_programs(status);

CREATE INDEX idx_programs_created_by
    ON lottery_programs(created_by);

CREATE INDEX idx_prizes_program
    ON prizes(program_id);

CREATE INDEX idx_tickets_program_status
    ON lottery_tickets(program_id, status);

CREATE INDEX idx_tickets_held_until
    ON lottery_tickets(held_until)
    WHERE status = 'held';

CREATE INDEX idx_orders_user_created
    ON orders(user_id, created_at DESC);

CREATE INDEX idx_orders_status
    ON orders(status);

CREATE INDEX idx_order_items_ticket
    ON order_items(ticket_id);

CREATE INDEX idx_payments_order
    ON payments(order_id);

CREATE INDEX idx_payments_status
    ON payments(status);

CREATE INDEX idx_draws_program
    ON draws(program_id);

CREATE INDEX idx_draw_results_draw
    ON draw_results(draw_id);

CREATE INDEX idx_winners_user
    ON winners(user_id);

CREATE INDEX idx_winners_claim_status
    ON winners(claim_status);

CREATE INDEX idx_audit_logs_created
    ON audit_logs(created_at DESC);

CREATE INDEX idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_logs_actor
    ON audit_logs(actor_user_id);

-- Initial roles
INSERT INTO roles (role_name, description)
VALUES
    ('ADMIN', 'Quản trị toàn bộ hệ thống'),
    ('ORGANIZER', 'Quản lý chương trình quay số và giải thưởng'),
    ('USER', 'Người dùng tham gia chương trình'),
    ('AUDITOR', 'Kiểm tra lịch sử và tính minh bạch')
ON CONFLICT (role_name) DO NOTHING;
