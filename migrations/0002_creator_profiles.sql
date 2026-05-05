-- ====================================================================
-- PR #7: creator_profiles table for end-to-end demo wiring.
-- ====================================================================
-- This is the PUBLIC creator listing that users browse. Intentionally
-- separate from creator_agent_profiles (the production-grade KYC table).
-- They overlap on (mobile_number, name) and should converge in a future
-- schema unification — for now this simpler table backs the demo.
-- ====================================================================

CREATE TABLE IF NOT EXISTS creator_profiles (
    id varchar PRIMARY KEY,
    mobile_number text NOT NULL UNIQUE,
    name text NOT NULL,
    country text NOT NULL DEFAULT 'India',
    followers integer NOT NULL DEFAULT 0,
    price_per_minute integer NOT NULL,
    is_online text NOT NULL DEFAULT 'true',
    random_match_enabled text NOT NULL DEFAULT 'false',
    allowed_call_types text NOT NULL DEFAULT 'both',
    languages jsonb NOT NULL DEFAULT '[]'::jsonb,
    about_me text,
    talks_about jsonb,
    hobbies jsonb,
    food_preferences jsonb,
    sports_interests jsonb,
    photo_url text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_mobile_number ON creator_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_is_online ON creator_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_random_match ON creator_profiles(random_match_enabled);
