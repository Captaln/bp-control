import { GoogleGenAI, Type } from "@google/genai";
import { Message, MoodLog } from "../types";

// Initialize the client. The key MUST be in process.env.API_KEY
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select a key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const getVentResponse = async (
  history: Message[], 
  userInput: string, 
  mode: 'calm' | 'roast'
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Sliding Window: Keep the last 10 messages for context, excluding the local 'init' placeholder
    // This ensures the model stays focused on the recent conversation and prevents context bloat.
    const WINDOW_SIZE = 10;
    const relevantHistory = history
      .filter(msg => msg.id !== 'init')
      .slice(-WINDOW_SIZE)
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    // Dynamic System Instruction based on current mode
    const systemInstruction = `You are a supportive, adaptive anger management companion app called BP Control. 
    
    CURRENT MODE: ${mode === 'calm' ? 'CALM COACH' : 'ROAST MASTER'}

    Behaviors:
    - Calm Coach: Wise, empathetic, soothing. Validate feelings, suggest deep breaths.
    - Roast Master: Witty, sarcastic, good-natured. Roast the situation (not the user) to show its absurdity.

    CRITICAL RULES:
    1. Keep responses concise (under 4 sentences).
    2. Maintain conversational continuity based on the provided history.
    3. NEVER mention you are an AI, Gemini, or from Google. You are "BP Control".`;

    const contents = [
      ...relevantHistory,
      { role: 'user', parts: [{ text: userInput }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "I'm listening. Tell me more.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having a little trouble connecting. Take a deep breath and try again.";
  }
};

export const getCalmResponse = async (ventText: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `The user is venting about the following anger source: "${ventText}". 
    Act as a wise, slightly humorous, and very empathetic anger management coach. 
    1. Validate their frustration briefly.
    2. Offer a reframing perspective or a witty observation to diffuse the tension.
    3. Keep it under 50 words. Make them smile if possible.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "I'm listening. Take a deep breath. Sometimes technology fails us, but your calm is within.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the cosmic wisdom cloud. But I hear you. Take a breath.";
  }
};

export const getJoke = async (): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Tell me a very funny, clean, short joke or a "dad joke" to help someone who is angry feel better. Just the joke.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "Why did the scarecrow win an award? Because he was outstanding in his field!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I tried to find a joke, but I got distracted by a squirrel. Imagine a squirrel falling over.";
  }
};

export const getRoastMyAnger = async (angerSource: string): Promise<string> => {
    try {
      const ai = getClient();
      const prompt = `The user is angry about: "${angerSource}". 
      Lightheartedly "roast" this situation (not the user) to show how trivial or silly it might seem in the grand scheme of the universe. 
      Make it funny and disarming. Keep it short.`;
  
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
  
      return response.text || "That sounds annoying, but is it 'ruin my whole day' annoying? Probably not!";
    } catch (error) {
      return "Even the AI is speechless. Just laugh at the absurdity of it all.";
    }
  };

export const getAffirmation = async (): Promise<string> => {
  try {
    const ai = getClient();
    // Add random themes and a random seed to prompt to force variety
    const themes = ["nature", "inner strength", "letting go", "breathing", "patience", "peaceful mind", "gratitude", "self-compassion"];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomSeed = Math.floor(Math.random() * 1000);

    const prompt = `Generate a unique, short, soothing, and empowering affirmation related to '${randomTheme}'. 
    It should be simple, positive, and under 15 words. Do not use quotes. Random seed: ${randomSeed}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
       config: {
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 1.2, // Higher temperature for more creativity/randomness
      }
    });

    return response.text?.trim() || "I am calm, present, and at peace.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I breathe in peace and breathe out tension.";
  }
};

export const getMoodInsights = async (logs: MoodLog[]): Promise<string> => {
  try {
    const ai = getClient();
    
    // 1. Prepare data summary (limit to last 30 to fit context, focus on patterns)
    // We format it to be easily readable by the LLM
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

      1. 🕵️ **The Pattern**: Identify a specific pattern in timing (e.g., "Monday Mornings") or triggers.
      2. 🧠 **The Insight**: Point out a correlation (e.g., "When you use 'Music', your intensity is lower" or "Traffic is your most frequent enemy").
      3. 💡 **Actionable Tip**: One short, specific suggestion based on this data.

      Tone: Constructive, friendly, slightly analytical but accessible. Keep it under 150 words total.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Not enough data to find a pattern yet. Keep tracking!";
  } catch (error) {
    console.error("Gemini Insight Error", error);
    return "My magnifying glass is a bit foggy (Connection Error). Try again later.";
  }
};