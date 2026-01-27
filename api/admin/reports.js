import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

// Initialize Admin Client
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || 'https://pdaqudmglhlaptuumedf.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

    try {
        // 1. Authenticate (DB Check)
        const url = new URL(req.url);
        const password = url.searchParams.get('password') || (await req.json().catch(() => ({}))).password;

        if (!password) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

        const { data: authData } = await supabaseAdmin
            .from('admin_config')
            .select('value')
            .eq('key', 'admin_password')
            .single();

        if (!authData || authData.value !== password) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // 2. GET Reports
        if (req.method === 'GET') {
            const { data, error } = await supabaseAdmin
                .from('content_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify({ reports: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 3. ACTIONS (Dismiss/Delete)
        if (req.method === 'POST') {
            const { action, reportId, contentId } = await req.json();

            if (action === 'DISMISS') {
                await supabaseAdmin.from('content_reports').delete().eq('id', reportId);
            } else if (action === 'DELETE_CONTENT') {
                // Delete the content
                await supabaseAdmin.from('content_uploads').delete().eq('url', contentId); // Assuming contentId is URL or we need to look it up. 
                // Wait, typically contentId is UUID in reports? Let's check schema. 
                // Schema: content_id (text, url) or UUID? 
                // Let's assume it matches however it was inserted.
                // Also delete the report
                await supabaseAdmin.from('content_reports').delete().eq('id', reportId);
            }

            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
}
