import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST' } });
    }

    try {
        const body = req.method === 'POST' ? await req.json() : {};
        const url = new URL(req.url);
        const password = url.searchParams.get('password') || body.password;

        if (!password) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        const { data: authData } = await supabase
            .from('admin_config')
            .select('value')
            .eq('key', 'admin_password')
            .single();

        if (!authData || authData.value !== password) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        // GET: Fetch Ad Config
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('admin_config')
                .select('*')
                .in('key', ['ad_feed_frequency', 'ad_story_frequency', 'ad_banner_enabled', 'ad_banner_content']);

            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
        }

        // POST: Update Ad Config
        if (req.method === 'POST') {
            const { setting, value } = body;
            // Expect body: { password, setting: 'ad_feed_frequency', value: '5' }

            const { error } = await supabase
                .from('admin_config')
                .upsert({ key: setting, value: value.toString() });

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
