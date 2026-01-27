import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }

    try {
        const { currentPassword, newPassword } = await req.json();

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 1. Verify Current
        const { data } = await supabase
            .from('admin_config')
            .select('value')
            .eq('key', 'admin_password')
            .single();

        if (data.value !== currentPassword) {
            return new Response(JSON.stringify({ success: false, error: 'Wrong current password' }), { status: 401 });
        }

        // 2. Update
        const { error: updateError } = await supabase
            .from('admin_config')
            .update({ value: newPassword, updated_at: new Date().toISOString() })
            .eq('key', 'admin_password');

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
