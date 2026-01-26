import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders
        });
    }

    try {
        const { history, userInput, mode } = await req.json(); // Match client payload

        // Construct prompt based on mode
        let systemPrompt = "You are a helpful, calm mental health assistant.";
        if (mode === 'roast') {
            systemPrompt = "You are a funny, lighthearted roast master. Roast the user's situation playfully but don't be mean-spirited.";
        }

        // Combine history + input for context (simplified for MVP)
        const prompt = `${systemPrompt}\n\nUser: ${userInput}`;

        // Initialize Gemini Model
        // Initialize Gemini Model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Generate response
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return new Response(JSON.stringify({ text }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate response', details: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
