-- =============================================================================
-- Initial schema migration (Manus §1.1)
-- =============================================================================
-- Generated to match shared/schema.ts. Apply with `npm run db:migrate`.
--
-- Subsequent migrations should be created with drizzle-kit:
--   npx drizzle-kit generate --config drizzle.config.ts
-- which will pick up changes to shared/schema.ts and emit a numbered SQL file
-- in this directory.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    password text NOT NULL
);

CREATE TABLE IF NOT EXISTS creator_agent_profiles (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    role text NOT NULL,
    mobile_number text NOT NULL UNIQUE,
    email text,
    name text NOT NULL,
    bank_account_number text,
    bank_ifsc_code text,
    bank_account_name text,
    aadhar_number text,
    pan_number text,
    referral_code text UNIQUE,
    referred_by text,
    approval_status text NOT NULL DEFAULT 'pending',
    rejection_reason text,
    language text DEFAULT 'en',
    random_match_enabled text NOT NULL DEFAULT 'false',
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    banned_at timestamp
);

CREATE TABLE IF NOT EXISTS admin_users (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_number text NOT NULL UNIQUE,
    name text NOT NULL,
    email text,
    role text NOT NULL,
    is_active text NOT NULL DEFAULT 'true',
    created_at timestamp NOT NULL DEFAULT now(),
    created_by varchar
);

CREATE TABLE IF NOT EXISTS creator_pricing (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id varchar NOT NULL,
    per_minute_rate integer NOT NULL,
    updated_at timestamp NOT NULL DEFAULT now(),
    updated_by varchar
);

CREATE TABLE IF NOT EXISTS agency_commission (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id varchar NOT NULL,
    commission_rate integer NOT NULL,
    updated_at timestamp NOT NULL DEFAULT now(),
    updated_by varchar
);

CREATE TABLE IF NOT EXISTS user_wallets (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL UNIQUE,
    balance numeric(10, 2) NOT NULL DEFAULT 0.00,
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gifts_config (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    amount integer NOT NULL,
    name text NOT NULL,
    image_url text NOT NULL,
    icon_type text,
    is_active text NOT NULL DEFAULT 'true',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    updated_by varchar
);

CREATE TABLE IF NOT EXISTS gift_transactions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id text NOT NULL,
    recipient_id text NOT NULL,
    gift_id varchar NOT NULL,
    amount integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recharge_transactions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    payment_method text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_transactions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    creator_id text NOT NULL,
    call_type text NOT NULL DEFAULT 'audio',
    duration_seconds integer NOT NULL,
    price_per_minute integer NOT NULL,
    total_cost numeric(10, 2) NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_logs (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    call_transaction_id varchar,
    user_id text NOT NULL,
    creator_id text NOT NULL,
    duration_seconds integer NOT NULL,
    quality_score integer,
    network_quality text,
    drop_reason text,
    revenue numeric(10, 2),
    started_at timestamp NOT NULL,
    ended_at timestamp,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_performance (
    creator_id varchar NOT NULL,
    period_start timestamp NOT NULL,
    period_end timestamp NOT NULL,
    total_calls integer NOT NULL DEFAULT 0,
    total_minutes integer NOT NULL DEFAULT 0,
    total_revenue numeric(10, 2) NOT NULL DEFAULT 0,
    avg_call_quality numeric(3, 2),
    drop_rate numeric(5, 2),
    rank integer,
    updated_at timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY (creator_id, period_start)
);

CREATE TABLE IF NOT EXISTS creator_rewards (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id varchar NOT NULL,
    reward_type text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    status text NOT NULL DEFAULT 'distributed',
    distributed_at timestamp DEFAULT now(),
    created_at timestamp NOT NULL DEFAULT now()
);

-- =============================================================================
-- Unified `transactions` table (added in this PR for IStorage compatibility).
-- =============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    type text NOT NULL,
    amount numeric(12, 2) NOT NULL,
    currency text NOT NULL DEFAULT 'INR',
    status text NOT NULL,
    payment_method text,
    transaction_id text NOT NULL UNIQUE,
    gateway_transaction_id text,
    bonus_amount numeric(12, 2) NOT NULL DEFAULT 0,
    metadata jsonb,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_config_active ON gifts_config(is_active, sort_order);
