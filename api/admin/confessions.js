import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST' } });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Env: VITE_SUPABASE_URL or SERVICE_ROLE_KEY');
        }

        // Admin Service Client (Bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { action, id, updates, password } = await req.json();

        // 1. Verify Admin Password (simple check)
        const { data: authData } = await supabase
            .from('admin_config')
            .select('value')
            .eq('key', 'admin_password')
            .single();

        if (!authData || authData.value !== password) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        let result;

        // 2. Perform Action
        if (action === 'update' && id && updates) {
            result = await supabase.from('confessions').update(updates).eq('id', id).select();
        } else if (action === 'delete' && id) {
            result = await supabase.from('confessions').delete().eq('id', id).select();
        } else if (action === 'create' && updates) {
            result = await supabase.from('confessions').insert({
                ...updates,
                is_approved: true,
                is_nsfw: false,
                created_at: new Date().toISOString()
            }).select();
        } else {
            return new Response(JSON.stringify({ error: 'Invalid Action' }), { status: 400 });
        }

        if (result.error) throw result.error;

        return new Response(JSON.stringify({ success: true, data: result.data }), {
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
