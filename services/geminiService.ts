import { Message, MoodLog } from "../types";

import { Capacitor } from '@capacitor/core';

// Secure API endpoint (Vercel)
// Use full URL for Native App, relative path for Web (to handle Previews correctly)
const API_BASE_URL = Capacitor.isNativePlatform()
  ? "https://bp-control.vercel.app/api"
  : "/api";

const safeFetch = async (endpoint: string, method: string, body?: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error(`Secure API Error (${endpoint}):`, error);
    throw error;
  }
};

export const getVentResponse = async (
  history: Message[],
  userInput: string,
  mode: 'calm' | 'roast'
): Promise<string> => {
  try {
    return await safeFetch('/vent', 'POST', { history, userInput, mode });
  } catch (error) {
    return "I'm having a little trouble connecting to the secure server. Please check your internet.";
  }
};

export const getCalmResponse = async (ventText: string): Promise<string> => {
  try {
    // Re-use vent endpoint with specfic prompt construction if needed, 
    // or just simplify to use the generic vent endpoint for now
    return await safeFetch('/vent', 'POST', {
      history: [],
      userInput: `(Context: ${ventText}) Please give me a calm, validating response.`,
      mode: 'calm'
    });
  } catch (error) {
    return "I hear you. Take a deep breath.";
  }
};

export const getJoke = async (): Promise<string> => {
  // Simple client-side fallback to avoid extra API complexity for simple things
  const jokes = [
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "I'm on a seafood diet. I see food and I eat it.",
    "Parallel lines have so much in common. It’s a shame they’ll never meet.",
    "Why don't skeletons fight each other? They don't have the guts."
  ];
  return jokes[Math.floor(Math.random() * jokes.length)];
};

export const getRoastMyAnger = async (angerSource: string): Promise<string> => {
  try {
    return await safeFetch('/vent', 'POST', {
      history: [],
      userInput: `(Context: ${angerSource}) Roast this situation funny and lightheartedly.`,
      mode: 'roast'
    });
  } catch (error) {
    return "That sounds annoying, but is it 'ruin my whole day' annoying? Probably not!";
  }
};

export const getAffirmation = async (): Promise<string> => {
  try {
    return await safeFetch('/affirmation', 'GET');
  } catch (error) {
    return "I breathe in peace and breathe out tension.";
  }
};

export const getMoodInsights = async (logs: MoodLog[]): Promise<string> => {
  try {
    return await safeFetch('/insights', 'POST', { logs });
  } catch (error) {
    return "Not enough data to find a pattern yet. Keep tracking!";
  }
};