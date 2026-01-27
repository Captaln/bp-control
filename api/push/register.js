import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

// Initialize Admin Client (Needed to bypass RLS if user is not logged in, or use service key for stability)
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
    // Basic CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
        const { token, device_id, platform, user_id } = await req.json();

        if (!token || !device_id) {
            return new Response(JSON.stringify({ error: 'Missing token or device_id' }), { status: 400, headers: corsHeaders });
        }

        // Upsert token
        const { error } = await supabase
            .from('push_tokens')
            .upsert({
                token,
                device_id,
                platform: platform || 'unknown',
                user_id: user_id || null, // Can be null if anonymous
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'device_id, platform',
                ignoreDuplicates: false
            });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
}
