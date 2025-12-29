import { GoogleGenAI } from "@google/genai";

// Use the Vite environment variable
const PLATFORM_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || "";

export const AIService = {
  /**
   * Returns a ready-to-use Gemini client using the env key.
   */
  getClient: () => {
    try {
      if (!PLATFORM_KEY) {
        console.warn("VITE_GEMINI_API_KEY is missing.");
        return null;
      }
      return new GoogleGenAI({ apiKey: PLATFORM_KEY });
    } catch (e) {
      console.error("AI Initialization Failure:", e);
      return null;
    }
  },
  
  /**
   * Helper to get the key directly
   */
  getApiKey: () => PLATFORM_KEY
};