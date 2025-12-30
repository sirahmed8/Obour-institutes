
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

import { toast } from 'react-hot-toast';

// 1. Setup Clients using import.meta.env (CRITICAL FIX)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "dummy_key");

const openRouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true, // FORCE THIS
  defaultHeaders: {
    "HTTP-Referer": window.location.origin, // Required for CORS
    "X-Title": "Obour Institutes",
    "Content-Type": "application/json"
  }
});

const deepSeek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  dangerouslyAllowBrowser: true 
});

const moonshot = new OpenAI({
  baseURL: "https://api.moonshot.ai/v1",
  apiKey: import.meta.env.VITE_MOONSHOT_API_KEY,
  dangerouslyAllowBrowser: true
});

export type AIModel = 'gemini' | 'openrouter' | 'deepseek' | 'kimi';

/**
 * Unified Generator Function
 */
export const generateAIResponse = async (message: string, context: string, modelProvider: AIModel = 'gemini'): Promise<string> => {
  const fullPrompt = context ? `CONTEXT:\n${context}\n\nUSER QUERY:\n${message}` : message;

  try {
    switch (modelProvider) {
      case 'gemini':
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Or gemini-1.5-flash if 2.5 is not available yet for public
        const result = await model.generateContent(fullPrompt);
        return result.response.text();

      case 'openrouter':
        try {
          const orResponse = await openRouter.chat.completions.create({
            model: "openai/gpt-oss-20b:free", // Primary
            messages: [{ role: "user", content: fullPrompt }],
          });
          return orResponse.choices[0].message.content || "No response.";
        } catch (e) {
          console.warn("Primary AI Model Failed, switching to fallback...", e);
          // Fallback to liquid/lfm-40b if free gpt fails
          const fallback = await openRouter.chat.completions.create({
            model: "liquid/lfm-40b", 
            messages: [{ role: "user", content: fullPrompt }],
          });
          return fallback.choices[0].message.content || "No response (Fallback).";
        }

      case 'deepseek':
        const dsResponse = await deepSeek.chat.completions.create({
          model: "deepseek-chat",
          messages: [{ role: "user", content: fullPrompt }],
        });
        return dsResponse.choices[0].message.content || "No response.";

      case 'kimi':
        const kimiResponse = await moonshot.chat.completions.create({
          model: "moonshot-v1-8k",
          messages: [{ role: "user", content: fullPrompt }],
        });
        return kimiResponse.choices[0].message.content || "No response.";

      default:
        throw new Error("Invalid Model Provider Selected");
    }
  } catch (error: any) {
    console.error(`AI Service Error [${modelProvider}]:`, error);
    // User requested specific error toast before offline fallback
    if (error?.message?.includes('401') || error?.message?.includes('API key')) {
        toast.error("AI Connection Error: Invalid API Key");
    } else if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        toast.error("AI Busy: Rate limit exceeded");
    } else {
        toast.error(`Connection Failed: ${error.message || 'Unknown error'}`);
    }
    throw error; 
  }
};
