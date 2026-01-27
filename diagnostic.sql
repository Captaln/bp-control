-- DIAGNOSTIC: Check if uploads exist
SELECT count(*) as total_uploads FROM content_uploads;

-- Show the last 5 uploads (if any)
SELECT id, status, is_trusted, description, created_at, user_id FROM content_uploads ORDER BY created_at DESC LIMIT 5;

-- Check table definition (verify user_id nullable)
SELECT is_nullable FROM information_schema.columns WHERE table_name = 'content_uploads' AND column_name = 'user_id';
