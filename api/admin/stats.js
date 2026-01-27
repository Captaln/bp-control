import { createClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export const config = {
    runtime: 'edge',
};

// Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || 'https://pdaqudmglhlaptuumedf.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// R2 Client for meme count
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        // AUTH CHECK
        const url = new URL(req.url);
        const password = url.searchParams.get('password');

        if (!password) {
            // Optional: allow if internal? No, secure it.
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        const { data: authData } = await supabaseAdmin
            .from('admin_config')
            .select('value')
            .eq('key', 'admin_password')
            .single();

        if (!authData || authData.value !== password) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Parallel fetching for speed
        const [
            usersResult,
            sessionsToday,
            profilesCount,
            gameEvents,
            bpLogs,
            memeListResult
        ] = await Promise.all([
            // 1. Total registered users (from auth)
            supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),

            // 2. Active sessions TODAY (unique devices)
            supabaseAdmin
                .from('app_sessions')
                .select('device_id', { count: 'exact', head: true })
                .gte('started_at', todayStart),

            // 3. Total Profiles (Auth + Anon)
            supabaseAdmin
                .from('profiles')
                .select('id', { count: 'exact', head: true }),

            // 4. Game events (last 7 days by game)
            supabaseAdmin
                .from('user_events')
                .select('event_data')
                .eq('event_type', 'game_start')
                .gte('created_at', last7Days),

            // 5. BP Logs count (all time)
            supabaseAdmin
                .from('user_events')
                .select('id', { count: 'exact', head: true })
                .eq('event_type', 'bp_log'),

            // 6. Meme count from Supabase (content_uploads table)
            supabaseAdmin
                .from('content_uploads')
                .select('id', { count: 'exact', head: true })
        ]);

        // Process game popularity
        const gameCounts = {};
        if (gameEvents.data) {
            gameEvents.data.forEach(e => {
                const game = e.event_data?.game || 'unknown';
                gameCounts[game] = (gameCounts[game] || 0) + 1;
            });
        }

        // Build DAU for last 7 days (simplified - just show today's count repeated)
        // For accurate DAU, we'd need to query each day separately
        const dauToday = sessionsToday.count || 0;
        const dau_trend = [0, 0, 0, 0, 0, 0, dauToday]; // Placeholder, last one is today

        return new Response(JSON.stringify({
            // Core Stats
            totalUsers: profilesCount.count || 0,          // Total profiles (Auth + Anon)
            registeredUsers: usersResult.data?.total || 0, // Supabase auth users
            activeToday: dauToday,
            memeCount: memeListResult?.count || 0,
            bpLogsTotal: bpLogs.count || 0,

            // Game Popularity
            gamesPlayed: gameCounts,

            // Trends (simplified)
            trends: {
                dau: dau_trend,
            }
        }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        console.error('Stats API Error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            totalUsers: 0,
            activeToday: 0,
            memeCount: 0,
            bpLogsTotal: 0,
            gamesPlayed: {}
        }), {
            status: 200, // Return 200 with zeros to not break dashboard
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
        });
    }
}
