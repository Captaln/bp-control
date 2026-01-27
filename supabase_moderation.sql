-- =============================================
-- PHASE 5: CONTENT MODERATION SYSTEM
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create content_uploads table
CREATE TABLE IF NOT EXISTS content_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),       -- Who uploaded it
    url TEXT NOT NULL,                            -- R2 Public URL
    type TEXT NOT NULL,                           -- 'image' or 'video'
    category TEXT DEFAULT 'uncategorized',
    status TEXT DEFAULT 'pending',                -- 'pending', 'approved', 'rejected'
    is_trusted BOOLEAN DEFAULT false,             -- If true, auto-approves
    admin_notes TEXT,                             -- Reason for rejection etc.
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uploads_status ON content_uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON content_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created ON content_uploads(created_at);

-- 2. RLS Policies
ALTER TABLE content_uploads ENABLE ROW LEVEL SECURITY;

-- Public can VIEW 'approved' content
CREATE POLICY "Public sees approved content" ON content_uploads
    FOR SELECT USING (status = 'approved');

-- Users can VIEW their own content (any status)
CREATE POLICY "Users see own content" ON content_uploads
    FOR SELECT USING (auth.uid() = user_id);

-- Creators can INSERT their own content (default pending)
CREATE POLICY "Creators can upload" ON content_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service Role (Admin) has full access
CREATE POLICY "Service role full access" ON content_uploads
    FOR ALL USING (auth.role() = 'service_role');

-- 3. Add 'is_trusted' to profiles (optional, for auto-approval)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT false;
