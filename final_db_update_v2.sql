-- Add description column for credits/captions
ALTER TABLE content_uploads ADD COLUMN IF NOT EXISTS description TEXT;
