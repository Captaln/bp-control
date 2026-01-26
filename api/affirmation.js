/**
 * BP Control - Secure Affirmation API
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

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
};
