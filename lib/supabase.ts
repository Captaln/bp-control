import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://pdaqudmglhlaptuumedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkYXF1ZG1nbGhsYXB0dXVtZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjYwMzMsImV4cCI6MjA4NTAwMjAzM30.uVUZV3ya1mKJ0oBcG9z92rrEcSHvMYGIHEQwo5lyJ48';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
