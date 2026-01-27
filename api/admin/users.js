import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

// Initialize Admin Client (Only works server-side with Service Key)
const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || 'https://pdaqudmglhlaptuumedf.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req) {
    // Basic CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

    try {
        // AUTH CHECK
        const url = new URL(req.url);
        const params = Object.fromEntries(url.searchParams);
        const body = req.method === 'POST' ? await req.json() : {};
        const password = params.password || body.password;

        if (!password) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

        const { data: authData } = await supabaseAdmin
            .from('admin_config')
            .select('value')
            .eq('key', 'admin_password')
            .single();

        if (!authData || authData.value !== password) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // 1. LIST USERS
        if (req.method === 'GET') {
            // Fetch Auth Users
            const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
            if (authError) throw authError;

            // Fetch Profiles (which includes Anon users)
            const { data: profiles, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('*');

            if (profileError) throw profileError;

            // Merge Data
            const combinedUsers = profiles.map(profile => {
                const authUser = authUsers.find(u => u.id === profile.id);
                if (authUser) {
                    // It's a registered user
                    return {
                        ...authUser,
                        user_metadata: {
                            ...authUser.user_metadata,
                            username: profile.username,
                            is_creator: profile.is_creator,
                            is_trusted: profile.is_trusted,
                            is_shadow_banned: profile.is_shadow_banned
                        }
                    };
                } else {
                    // It's an anonymous user
                    return {
                        id: profile.id,
                        email: profile.username || 'Anonymous', // Show username as email for easy ID
                        created_at: profile.created_at || new Date().toISOString(),
                        last_sign_in_at: profile.updated_at || new Date().toISOString(),
                        user_metadata: {
                            username: profile.username,
                            is_creator: profile.is_creator,
                            is_trusted: profile.is_trusted,
                            is_shadow_banned: profile.is_shadow_banned,
                            is_anonymous: true
                        },
                        app_metadata: {
                            provider: 'anonymous'
                        }
                    };
                }
            });

            // Also add any auth users that MIGHT be missing a profile (edge case)
            authUsers.forEach(u => {
                if (!combinedUsers.find(cu => cu.id === u.id)) {
                    combinedUsers.push(u);
                }
            });

            return new Response(JSON.stringify({ users: combinedUsers }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2. MODIFY USER (Ban, Role, Metadata)
        if (req.method === 'POST') {
            const { action, userId, payload } = await req.json();

            if (action === 'BAN') {
                // Also delete from profiles
                await supabaseAdmin.from('profiles').delete().eq('id', userId);

                // Try to delete from Auth (might fail if it's an anonymous user)
                const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

                if (error && !error.message.includes('User not found') && error.status !== 404) {
                    throw error;
                }

                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            if (action === 'UPDATE_METADATA') {
                // Update auth user_metadata (if user exists in Auth)
                try {
                    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                        user_metadata: payload
                    });
                    // If error is "User not found", it's likely an anonymous user - ignore and proceed to profile update
                    if (error && !error.message.includes('not found') && error.status !== 404) {
                        console.error('Auth update error:', error);
                        // We don't throw here, so we can still update the profile
                    }
                } catch (err) {
                    // Ignore auth errors for anon users
                    console.log('Skipping auth update for mostly likely anon user:', userId);
                }

                // Also sync to profiles table for app to read
                const profileUpdate = {};
                if (typeof payload.is_creator !== 'undefined') {
                    profileUpdate.is_creator = payload.is_creator;
                }
                if (typeof payload.is_shadow_banned !== 'undefined') {
                    profileUpdate.is_shadow_banned = payload.is_shadow_banned;
                }
                if (typeof payload.is_trusted !== 'undefined') {
                    profileUpdate.is_trusted = payload.is_trusted;
                }

                if (Object.keys(profileUpdate).length > 0) {
                    profileUpdate.updated_at = new Date().toISOString();

                    // Upsert to profiles (create if doesn't exist)
                    await supabaseAdmin.from('profiles').upsert({
                        id: userId,
                        username: payload.username || `User_${userId.slice(0, 8)}`,
                        ...profileUpdate
                    }, { onConflict: 'id' });
                }

                return new Response(JSON.stringify({ success: true, userId }), { headers: corsHeaders });
            }
        }

        return new Response('Method not allowed', { status: 405, headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
