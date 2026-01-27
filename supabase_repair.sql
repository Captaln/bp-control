-- =============================================
-- REPAIR SCRIPT: Fix Permissions & Stats
-- Run this in Supabase SQL Editor to fix 0 stats/users
-- =============================================

-- 1. FIX APP SESSIONS (Stats)
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert sessions" ON app_sessions;
CREATE POLICY "Allow public insert sessions" ON app_sessions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update sessions" ON app_sessions;
CREATE POLICY "Allow public update sessions" ON app_sessions
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service role reads sessions" ON app_sessions;
CREATE POLICY "Service role reads sessions" ON app_sessions
    FOR SELECT USING (true); -- Relaxed for debugging (allows dashboard to read if using anon key, though usually uses service key)

-- 2. FIX USER EVENTS (Stats)
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert events" ON user_events;
CREATE POLICY "Allow public insert events" ON user_events
    FOR INSERT WITH CHECK (true);

-- 3. FIX PROFILES (Usernames/Creator)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (true);

-- 4. FIX PUSH TOKENS (Notifications)
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can manage push tokens" ON push_tokens;
CREATE POLICY "Anyone can manage push tokens" ON push_tokens
    FOR ALL USING (true);
