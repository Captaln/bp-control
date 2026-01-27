import { createClient } from '@supabase/supabase-js';

// Admin-only endpoint to list pending content and approve/reject it.
export const config = {
    runtime: 'edge',
};

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || 'https://pdaqudmglhlaptuumedf.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
    // CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

    // Verify Password (admin123) - Simple for MVP
    const { password } = req.method === 'GET' ?
        Object.fromEntries(new URL(req.url).searchParams) :
        await req.json().catch(() => ({}));

    // For POST, we might have read the body already. If so, logic below handles it.
    // Actually, for Edge Functions, we can clone request.

    // Let's rely on body for POST and query for GET
    if (req.method === 'POST') {
        // Re-read body safely?
        // Let's assume the previous await didn't consume it if we caught empty.
        // Actually, let's just parse it once.
    }

    try {
        if (req.method === 'GET') {
            // Auth Check
            const { data: authData } = await supabaseAdmin
                .from('admin_config')
                .select('value')
                .eq('key', 'admin_password')
                .single();

            if (!authData || authData.value !== password) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
            }

            // List Pending Content
            const { data, error } = await supabaseAdmin
                .from('content_uploads')
                .select('*, profiles(username)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify({ items: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (req.method === 'POST') {
            const body = await req.json();

            // Auth Check
            const { data: authData } = await supabaseAdmin
                .from('admin_config')
                .select('value')
                .eq('key', 'admin_password')
                .single();

            if (!authData || authData.value !== body.password) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
            }

            const { action, id, notes } = body; // action: 'APPROVE' | 'REJECT' | 'TRUST_USER'

            if (action === 'APPROVE') {
                await supabaseAdmin.from('content_uploads').update({ status: 'approved' }).eq('id', id);
            } else if (action === 'REJECT') {
                await supabaseAdmin.from('content_uploads').update({ status: 'rejected', admin_notes: notes }).eq('id', id);
            } else if (action === 'TRUST_USER') {
                // Get user_id from content
                const { data: content } = await supabaseAdmin.from('content_uploads').select('user_id').eq('id', id).single();
                if (content?.user_id) {
                    await supabaseAdmin.from('profiles').update({ is_trusted: true }).eq('id', content.user_id);
                    // Also approve the content
                    await supabaseAdmin.from('content_uploads').update({ status: 'approved' }).eq('id', id);
                }
            }

            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
}
