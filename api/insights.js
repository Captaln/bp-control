/**
 * BP Control - Secure Mood Insights API
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
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

      Provide a "Pattern Report" with exactly these 3 sections:

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
};
