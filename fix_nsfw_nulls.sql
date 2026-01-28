-- Fix any existing posts that have NULL nsfw value
UPDATE confessions 
SET is_nsfw = false 
WHERE is_nsfw IS NULL;

-- Verify it worked
SELECT count(*) as fixed_posts FROM confessions WHERE is_nsfw = false;
