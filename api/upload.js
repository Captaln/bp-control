import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, BUCKET_NAME } from "./r2.js";

export const config = {
    runtime: 'edge',
};

export default async function handler(req, res) {
    // CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    try {
        const { password, filename, filetype, category = 'uncategorized', description = '' } = await req.json();
        const authHeader = req.headers.get('authorization');

        let userId = null;
        let isTrusted = false;
        let status = 'pending';

        // 1. Check Auth
        let isAdmin = false;

        // Check against DB for Admin Password
        if (password) {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(
                process.env.VITE_SUPABASE_URL || 'https://pdaqudmglhlaptuumedf.supabase.co',
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            const { data } = await supabase
                .from('admin_config')
                .select('value')
                .eq('key', 'admin_password')
                .single();

            if (data && data.value === password) {
                isAdmin = true;
                status = 'approved';
                isTrusted = true;
            }
        }

        if (isAdmin) {
            // Admin Logic (Already set above)
        } else if (authHeader) {
            // Creator Path (Supabase Auth)
            const token = authHeader.replace('Bearer ', '');
            const { createClient } = await import('@supabase/supabase-js');

            const supabase = createClient(
                'https://pdaqudmglhlaptuumedf.supabase.co',
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), { status: 401, headers: corsHeaders });
            }

            userId = user.id;

            // Check Profile for Creator Access & Trust
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_creator, is_trusted')
                .eq('id', userId)
                .single();

            if (!profile?.is_creator) {
                return new Response(JSON.stringify({ error: 'Forbidden: Creators only' }), { status: 403, headers: corsHeaders });
            }

            // Trusted users bypass moderation
            if (profile.is_trusted) {
                status = 'approved';
                isTrusted = true;
            }

        } else {
            return new Response(JSON.stringify({ error: 'Unauthorized: No credentials' }), { status: 401, headers: corsHeaders });
        }

        // 2. Generate R2 Key
        const key = `memes/${category}-${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const finalUrl = `${process.env.PUBLIC_R2_DOMAIN || 'https://pub-0df0c3c106e947fb956e5b6e13629a63.r2.dev'}/${key}`;

        // 3. Insert into DB (Moderation Queue)
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
            'https://pdaqudmglhlaptuumedf.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error: dbError } = await supabaseAdmin
            .from('content_uploads')
            .insert({
                user_id: userId,
                url: finalUrl,
                type: filetype.startsWith('video') ? 'video' : 'image',
                category,
                description,
                status,
                is_trusted: isTrusted
            });

        if (dbError) {
            console.error('DB Insert Error:', dbError);
            throw new Error(`DB Error: ${dbError.message}`);
        }

        // 4. Generate Presigned URL
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: filetype,
        });

        const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

        return new Response(JSON.stringify({ uploadUrl, key }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("Upload Handshake Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
