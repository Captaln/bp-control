import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    try {
        const { reason, contentId, contentUrl } = await req.json();

        if (!reason || !contentId) {
            return new Response(JSON.stringify({ error: 'Missing details' }), { status: 400, headers: corsHeaders });
        }

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL || 'https://pdaqudmglhlaptuumedf.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabase
            .from('content_reports')
            .insert({
                content_id: contentId,
                content_url: contentUrl,
                reason,
                status: 'pending'
            });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: 'Report submitted' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error("Report Error:", error);
        return new Response(JSON.stringify({ error: 'Failed to submit report: ' + error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
}
