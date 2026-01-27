
// Note: This requires Firebase Admin SDK initialized with Service Account
// For now sending dummy success to allow UI testing until keys are added.

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    try {
        const { title, body, password } = await req.json();

        if (password !== 'admin123') {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        /* 
           TODO: Initialize Firebase Admin and sendFCM
           import admin from 'firebase-admin';
           if (!admin.apps.length) admin.initializeApp({...cert});
           await admin.messaging().sendToTopic('all_users', { notification: { title, body } });
        */

        console.log(`[BROADCAST_MOCK] Sending to ALL: ${title} - ${body}`);

        return new Response(JSON.stringify({ success: true, mocked: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
