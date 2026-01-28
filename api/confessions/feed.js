import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }

    try {
        const url = new URL(req.url);
        const type = url.searchParams.get('type') || 'feed'; // 'feed' (posts) or 'stories' (short)
        const page = parseInt(url.searchParams.get('page') || '0');
        const limit = 20;
        const offset = page * limit;

        let query = supabase
            .from('confessions')
            .select(`
                *,
                reactions:confession_reactions(count),
                comments:confession_comments(count)
            `)
            .eq('is_approved', true)
            .order('created_at', { ascending: false }) // Initial simple sort: Newest first
            .range(offset, offset + limit - 1);

        if (type === 'stories') {
            query = query.eq('type', 'story');
        } else {
            query = query.eq('type', 'post');
        }

        const { data, error } = await query;

        if (error) {
            console.error('Feed Query Error:', error);
            throw error;
        }

        console.log(`Feed Request: Type=${type}, Count=${data?.length}`);

        return new Response(JSON.stringify(data), {
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('Feed API Exception:', e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
