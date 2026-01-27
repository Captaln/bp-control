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
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, DELETE' } });
    }

    try {
        const body = req.method !== 'GET' ? await req.json() : {};
        const url = new URL(req.url);
        const password = url.searchParams.get('password') || body.password;

        // Auth Check
        const { data: authData } = await supabase
            .from('admin_config')
            .select('value')
            .eq('key', 'admin_password')
            .single();

        if (!password || !authData || authData.value !== password) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        // GET: List all confessions (even unapproved/reported)
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('confessions')
                .select('*, report_count')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
        }

        // POST: Approve/Reject (Toggle is_approved)
        if (req.method === 'POST') {
            const { id, action } = body;
            // action: 'APPROVE', 'REJECT' (set is_approved = false)

            const isApproved = action === 'APPROVE';

            const { error } = await supabase
                .from('confessions')
                .update({ is_approved: isApproved })
                .eq('id', id);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
        }

        // DELETE: Wipe
        if (req.method === 'DELETE') {
            const { id } = body;
            const { error } = await supabase
                .from('confessions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } });
        }

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
