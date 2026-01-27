import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

export const config = {
    runtime: 'nodejs', // web push needs nodejs runtime for firebase-admin usually, or we use REST API in edge
};

// Initialize Supabase Admin
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Firebase Admin
// We expect the service account JSON to be in the FIREBASE_SERVICE_ACCOUNT env var
let firebaseInitialized = false;

try {
    if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    firebaseInitialized = true;
} catch (e) {
    console.error('Firebase Admin Init Error:', e);
}

export default async function handler(req) {
    // Basic CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
        const { title, body, date, target_user_id } = await req.json();

        if (!firebaseInitialized) {
            return new Response(JSON.stringify({ error: 'Firebase not initialized. Check server logs.' }), { status: 500, headers: corsHeaders });
        }

        // Fetch tokens
        let query = supabase.from('push_tokens').select('token');

        if (target_user_id) {
            query = query.eq('user_id', target_user_id);
        }

        const { data: tokens, error } = await query;

        if (error) throw error;
        if (!tokens || tokens.length === 0) {
            return new Response(JSON.stringify({ message: 'No devices found to send to.' }), { status: 200, headers: corsHeaders });
        }

        // Prepare messages
        const messages = tokens.map(t => ({
            token: t.token,
            notification: {
                title: title || 'BP Control',
                body: body || 'Time to check in!',
            },
            data: {
                date: date || new Date().toISOString(),
            },
            android: {
                notification: {
                    sound: 'default',
                    priority: 'high',
                }
            }
        }));

        // Send (batch)
        const response = await admin.messaging().sendEach(messages);

        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx].token);
                }
            });
            // Optional: delete failed tokens
            if (failedTokens.length > 0) {
                await supabase.from('push_tokens').delete().in('token', failedTokens);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            sent: response.successCount,
            failed: response.failureCount
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Push Send Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
}
