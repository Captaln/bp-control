import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            'https://pdaqudmglhlaptuumedf.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { searchParams } = new URL(req.url);
        const singleId = searchParams.get('id');

        let query = supabase
            .from('content_uploads')
            .select('*');

        if (singleId) {
            query = query.eq('id', singleId).limit(1);
        } else {
            query = query.order('created_at', { ascending: false }).limit(50);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform to Feed items
        const feed = data.map(item => ({
            id: item.id,
            url: item.url,
            type: item.type,
            timestamp: item.created_at,
            category: item.category,
            description: item.description, // Include description
            likes: Math.floor(Math.random() * 500) + 50
        }));

        return new Response(JSON.stringify(feed), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Feed Error:", error);
        return new Response(JSON.stringify({ error: 'Failed to fetch feed', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
