-- =========================================================
-- FINAL REPAIR SCRIPT: Run this in Supabase SQL Editor
-- This fixes: Upload Failed, Missing Trust Button, & Stats
-- =========================================================

-- 1. Ensure 'content_uploads' table exists (Fixes Upload Failed)
CREATE TABLE IF NOT EXISTS content_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),       
    url TEXT NOT NULL,                            
    type TEXT NOT NULL,                           
    category TEXT DEFAULT 'uncategorized',
    status TEXT DEFAULT 'pending',                
    is_trusted BOOLEAN DEFAULT false,             
    admin_notes TEXT,                             
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure 'is_trusted' column exists in profiles (Fixes Trust Button logic)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_trusted') THEN
        ALTER TABLE profiles ADD COLUMN is_trusted BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. Fix RLS Policies (Allow Creators to Upload)
ALTER TABLE content_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public sees approved content" ON content_uploads;
DROP POLICY IF EXISTS "Users see own content" ON content_uploads;
DROP POLICY IF EXISTS "Creators can upload" ON content_uploads;
DROP POLICY IF EXISTS "Service role full access" ON content_uploads;

-- Re-create Policies
CREATE POLICY "Public sees approved content" ON content_uploads
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users see own content" ON content_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can upload" ON content_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON content_uploads
    FOR ALL USING (auth.role() = 'service_role');

-- 4. Fix Anonymous User Permissions (Fixes Permissions for App Users)
-- Allow Anon users to update their own profiles (needed for username sync)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow Anon users to insert their own profile (if not exists)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
