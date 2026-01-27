-- Create a key-value store for Admin Config (Password, etc.)
CREATE TABLE IF NOT EXISTS admin_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default password 'admin123' if it doesn't exist
INSERT INTO admin_config (key, value)
VALUES ('admin_password', 'admin123')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS but allow everything for Service Role (APIs)
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- No public policies (API only access)
