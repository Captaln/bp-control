/**
 * BP Control - Secure AI Proxy
 * 
 * This function keeps your API key safe on the server.
 * The app calls this function, and this function calls Google AI.
 * Hackers can NEVER see your API key!
 */

const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Your API key is stored securely in Firebase (set via: firebase functions:secrets:set GEMINI_API_KEY)
// It's NEVER sent to the app!

/**
 * Vent Response - AI Chat for anger management
 */
exports.ventResponse = onRequest(
    {
        cors: true,
        secrets: ["GEMINI_API_KEY"]
    },
    async (req, res) => {
        try {
            const { history, userInput, mode } = req.body;

            if (!userInput) {
                return res.status(400).json({ error: "Missing userInput" });
            }

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
    }
);

/**
 * Get Affirmation - Generates calming mantras
 */
exports.getAffirmation = onRequest(
    {
        cors: true,
        secrets: ["GEMINI_API_KEY"]
    },
    async (req, res) => {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const themes = ["nature", "inner strength", "letting go", "breathing", "patience", "peaceful mind", "gratitude", "self-compassion"];
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];

            const prompt = `Generate a unique, short, soothing, and empowering affirmation related to '${randomTheme}'. 
      It should be simple, positive, and under 15 words. Do not use quotes.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();

            res.json({ text });
        } catch (error) {
            console.error("Affirmation Error:", error);
            res.json({ text: "I breathe in peace and breathe out tension." });
        }
    }
);

/**
 * Get Mood Insights - AI Pattern Detective
 */
exports.getMoodInsights = onRequest(
    {
        cors: true,
        secrets: ["GEMINI_API_KEY"]
    },
    async (req, res) => {
        try {
            const { logs } = req.body;

            if (!logs || logs.length < 3) {
                return res.json({ text: "Not enough data yet. Keep tracking!" });
            }

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const dataSummary = logs.slice(0, 30).map(l => ({
                day: new Date(l.timestamp).toLocaleDateString('en-US', { weekday: 'long' }),
                time: new Date(l.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                intensity: l.intensity,
                triggers: l.triggers.join(', '),
                coping: l.coping.join(', ')
            }));

            const prompt = `
        Act as a Data Detective for an anger management app. Analyze these mood logs:
        ${JSON.stringify(dataSummary)}

        Provide a "Pattern Report" with exactly these 3 sections (use Markdown bolding for headers):

        1. 🕵️ **The Pattern**: Identify a specific pattern in timing or triggers.
        2. 🧠 **The Insight**: Point out a correlation.
        3. 💡 **Actionable Tip**: One short, specific suggestion.

        Tone: Constructive, friendly. Keep it under 150 words.
      `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            res.json({ text });
        } catch (error) {
            console.error("Insights Error:", error);
            res.json({ text: "My magnifying glass is foggy. Try again later." });
        }
    }
);
