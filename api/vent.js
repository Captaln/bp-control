/**
 * BP Control - Secure Vent Response API
 * 
 * Your API key is stored in Vercel's environment variables.
 * Hackers can NEVER see it!
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { history, userInput, mode } = req.body;

        if (!userInput) {
            return res.status(400).json({ error: "Missing userInput" });
        }

        // API key is securely stored in Vercel environment variables
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemInstruction = `You are a supportive, adaptive anger management companion app called BP Control. 
    
    CURRENT MODE: ${mode === 'calm' ? 'CALM COACH' : 'ROAST MASTER'}

    Behaviors:
    - Calm Coach: Wise, empathetic, soothing. Validate feelings, suggest deep breaths.
    - Roast Master: Witty, sarcastic, good-natured. Roast the situation (not the user) to show its absurdity.

    CRITICAL RULES:
    1. Keep responses concise (under 4 sentences).
    2. Maintain conversational continuity based on the provided history.
    3. NEVER mention you are an AI, Gemini, or from Google. You are "BP Control".`;

        // Format history for Gemini
        const formattedHistory = (history || [])
            .filter(msg => msg.id !== 'init')
            .slice(-10)
            .map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        const chat = model.startChat({
            history: formattedHistory,
            systemInstruction: systemInstruction
        });

        const result = await chat.sendMessage(userInput);
        const responseText = result.response.text();

        res.json({ text: responseText });
    } catch (error) {
        console.error("Vent Error:", error);
        res.status(500).json({ text: "I'm having trouble connecting. Take a deep breath and try again." });
    }
};
