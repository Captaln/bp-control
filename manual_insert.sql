-- FORCE INSERT TEST
-- Run this block to confirm DB is accepting data
INSERT INTO content_uploads (url, type, category, status, description, is_trusted)
VALUES 
('https://placehold.co/600x400/png', 'image', 'funny', 'approved', 'Manual Test Item', true);

-- CHECK AGAIN
SELECT count(*) as total_uploads FROM content_uploads;
