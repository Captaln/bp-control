-- =============================================
-- BP CONTROL: PHASE 4 DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. APP SESSIONS TABLE
-- Tracks every time someone opens the app (even without login)
CREATE TABLE IF NOT EXISTS app_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,                        -- Unique device fingerprint
    user_id UUID REFERENCES auth.users(id),         -- NULL if not logged in
    platform TEXT DEFAULT 'unknown',                -- 'android', 'ios', 'web'
    app_version TEXT DEFAULT '1.0.0',
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    session_duration_seconds INTEGER DEFAULT 0
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_sessions_device ON app_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON app_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON app_sessions(user_id);

-- 2. USER EVENTS TABLE
-- Tracks every action (game play, BP log, screen view, etc.)
CREATE TABLE IF NOT EXISTS user_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES app_sessions(id),
    device_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,                       -- 'game_start', 'game_end', 'bp_log', 'tab_view'
    event_data JSONB DEFAULT '{}',                  -- Extra data like game name, score, BP reading
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_events_device ON user_events(device_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON user_events(created_at);

-- 3. PUSH TOKENS TABLE
-- Stores FCM tokens for sending push notifications
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    device_id TEXT NOT NULL,
    token TEXT NOT NULL,
    platform TEXT DEFAULT 'android',                -- 'android', 'ios', 'web'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one token per device per platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_device_platform ON push_tokens(device_id, platform);

-- 4. ENABLE ROW LEVEL SECURITY (Important!)
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (Allow insert from anyone, read only for authenticated)
-- Sessions: Anyone can insert
CREATE POLICY "Anyone can create sessions" ON app_sessions
    FOR INSERT WITH CHECK (true);

-- Sessions: Only service role can read (for admin dashboard)
CREATE POLICY "Service role reads sessions" ON app_sessions
    FOR SELECT USING (auth.role() = 'service_role');

-- Events: Anyone can insert
CREATE POLICY "Anyone can create events" ON user_events
    FOR INSERT WITH CHECK (true);

-- Events: Only service role can read
CREATE POLICY "Service role reads events" ON user_events
    FOR SELECT USING (auth.role() = 'service_role');

-- Push tokens: Anyone can insert/update their own
CREATE POLICY "Anyone can manage push tokens" ON push_tokens
    FOR ALL USING (true);

-- =============================================
-- DONE! You should see 3 new tables in your database.
-- =============================================
