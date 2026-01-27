-- Clean up broken uploads
-- Deletes any upload that uses the old/wrong R2 domain
DELETE FROM content_uploads 
WHERE url LIKE '%pub-820845a707ba4d8f85102555776d354b%';

-- Also clean up duplicates if any
DELETE FROM content_uploads
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM content_uploads 
    GROUP BY url
);
