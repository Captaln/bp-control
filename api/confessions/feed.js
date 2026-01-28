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
        // 0. Get User ID from Token to check AGE
        const authHeader = req.headers.get('Authorization');
        let is18Plus = false;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);

            if (user) {
                // Fetch Profile Age
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('dob, is_18_plus')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    // Check DOB or override flag
                    if (profile.is_18_plus) is18Plus = true;
                    else if (profile.dob) {
                        const age = new Date().getFullYear() - new Date(profile.dob).getFullYear();
                        if (age >= 18) is18Plus = true;
                    }
                }
            }
        }

        let query = supabase
            .from('confessions')
            .select(`
                *,
                reactions:confession_reactions(count),
                comments:confession_comments(count)
            `)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // ALGORITHM: Safety Filter
        if (!is18Plus) {
            query = query.eq('is_nsfw', false); // Minors only see safe content
        }
        // If 18+, we show ALL (including NSFW). 
        // We could add an ?nsfw_only=true param later if needed.

        if (type === 'stories') {
            query = query.eq('type', 'story');
            // 24 Hour Limit for Stories
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            query = query.gt('created_at', yesterday);
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
