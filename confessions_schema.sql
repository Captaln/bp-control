-- Confessions Schema

-- 1. Confessions Table
CREATE TABLE IF NOT EXISTS confessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users, -- NULL for anonymous, or link to profile if we want tracking
  -- For strict anon, we might just store a hash of their ID, but referencing auth.users is safer for moderation.
  -- We will use RLS to ensure other users can't see WHO posted it.
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('story', 'post')), -- 'story' (short), 'post' (long)
  background_style TEXT DEFAULT 'default', -- For stories: 'fire', 'ocean', etc.
  allow_comments BOOLEAN DEFAULT true,
  allow_reactions BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true, -- Auto-approve for now, can change for moderation
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Reactions Table (Emojis)
CREATE TABLE IF NOT EXISTS confession_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID REFERENCES confessions ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(confession_id, user_id, emoji) -- One type of emoji per user per post (User can react with Heart AND Laugh, but not 2 Hearts)
);

-- 3. Comments Table
CREATE TABLE IF NOT EXISTS confession_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID REFERENCES confessions ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE confession_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE confession_comments ENABLE ROW LEVEL SECURITY;

-- 5. Policies

-- Everyone can READ approved confessions
CREATE POLICY "Public Read Confessions" ON confessions
FOR SELECT USING (is_approved = true);

-- Authenticated users (older than 3 days - logic handled in API preferably, but we can allow insert here)
-- We'll rely on API for the 3-day check to keep SQL simple, but strictly:
-- CREATE POLICY "User Post Confession" ON confessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "authenticated_insert_confessions" ON confessions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Authors can DELETE their own confessions
CREATE POLICY "Author Delete Confessions" ON confessions
FOR DELETE USING (auth.uid() = user_id);

-- Everyone can READ reactions/comments
CREATE POLICY "Public Read Reactions" ON confession_reactions FOR SELECT USING (true);
CREATE POLICY "Public Read Comments" ON confession_comments FOR SELECT USING (true);

-- Authenticated Users can INSERT reactions/comments
CREATE POLICY "User React" ON confession_reactions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User Comment" ON confession_comments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Authors of the CONFESSION can DELETE comments on their post
CREATE POLICY "Author Delete Comments" ON confession_comments
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM confessions 
    WHERE id = confession_comments.confession_id 
    AND user_id = auth.uid()
  )
  OR
  (auth.uid() = user_id) -- Or comment author can delete
);
