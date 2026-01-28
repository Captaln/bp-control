-- Add NSFW flag to confessions
ALTER TABLE confessions ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT false;

-- Add DOB to profiles (if it exists)
-- If we don't store profiles for everyone yet, let's make sure we do.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_18_plus BOOLEAN DEFAULT false;

-- Update Policies?
-- NSFW policy: We'll filter in API, but RLS could also help.
-- For now, API filtering is sufficient as per "Algorithm" request.
