import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST' } });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Server Configuration Error: Missing Service Role Key');
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // 1. Check Account Age (3 Day Rule)
        const createdAt = new Date(user.created_at).getTime();
        const now = Date.now();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

        if ((now - createdAt) < threeDaysMs) {
            // Optional: Disable for now if it blocks testing
            // return new Response(JSON.stringify({ error: 'Account too new. Must be 3 days old to post.' }), { status: 403 });
        }

        // 2. Validate Payload
        const { content, type, background_style, allow_comments, allow_reactions, is_nsfw } = await req.json();

        if (!content || !type) {
            return new Response(JSON.stringify({ error: 'Missing content or type' }), { status: 400 });
        }

        if (type === 'story' && content.length > 280) {
            return new Response(JSON.stringify({ error: 'Story too long (max 280 chars)' }), { status: 400 });
        }

        if (type === 'post' && content.length > 2000) {
            return new Response(JSON.stringify({ error: 'Post too long (max 2000 chars)' }), { status: 400 });
        }

        // 2. Validate Content
        if (!content || content.length > 5000) {
            return new Response(JSON.stringify({ error: 'Invalid content length' }), { status: 400 });
        }

        // Logic: Auto-approve Short Stories
        let isApproved = false;
        if (type === 'story') {
            isApproved = true;
        }

        // 3. Insert Confession
        const { data, error } = await supabase
            .from('confessions')
            .insert({
                user_id: user.id,
                content,
                type,
                background_style: type === 'story' ? (background_style || 'default') : null,
                allow_comments,
                allow_reactions,
                is_nsfw: !!is_nsfw,
                is_approved: isApproved
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, confession: data }), {
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
