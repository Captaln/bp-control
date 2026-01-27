import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

// Admin Client to Bypass RLS
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || 'https://pdaqudmglhlaptuumedf.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { id, username } = await req.json();

        if (!id) throw new Error("Missing ID");

        // Force Insert/Upsert into Profiles
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: id,
                username: username || `Guest_${id.slice(0, 5)}`,
                is_creator: false, // Default to false safe
                is_shadow_banned: false
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, profile: data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Guest Register Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
