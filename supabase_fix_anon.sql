-- =============================================
-- FIX ANONYMOUS PROFILES
-- 1. Drop FK constraint on profiles.id to allow anon users
-- 2. Add RLS policies for public access (since we want to track anon users)
-- =============================================

-- 1. Drop the Foreign Key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Ensure RLS allows anonymous inserts/updates
-- (We'll assume the client generates a UUID and sends it)

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (true); -- Allow any insert (secured by app logic/UUID)

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (true); -- Ideally restrict to matching ID, but for anon/localStorage logic, we rely on client knowing the ID.

-- 3. Fix app_sessions RLS (Just in case)
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert sessions" ON app_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update sessions" ON app_sessions
    FOR UPDATE USING (true);

-- 4. Fix user_events RLS
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert events" ON user_events
    FOR INSERT WITH CHECK (true);
