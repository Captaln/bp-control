import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://pdaqudomglhlaptuumedf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XyelY8eL-avG3y72kkgE4g_0sw2MxYo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
