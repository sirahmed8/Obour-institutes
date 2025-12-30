
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

import { toast } from 'react-hot-toast';

// 1. Setup Clients using import.meta.env (CRITICAL FIX)
// 1. Setup Clients
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "dummy_key");

const openRouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true, 
  defaultHeaders: {
    "HTTP-Referer": window.location.origin,
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
 * Unified Generator Function with Fallback Chain
 */
export const generateAIResponse = async (message: string, context: string, modelProvider: AIModel = 'gemini'): Promise<string> => {
  const fullPrompt = context ? `CONTEXT:\n${context}\n\nUSER QUERY:\n${message}` : message;

  // Constants for models
  const MODEL_GEMINI = "gemini-2.0-flash-exp"; // Trying 2.0 Flash first
  const MODEL_GEMINI_FALLBACK = "gemini-1.5-flash"; 
  const MODEL_OPENROUTER_PRIMARY = "openai/gpt-oss-20b:free"; // GPT-OSS (Free)
  const MODEL_OPENROUTER_FALLBACK = "google/gemini-2.0-flash-exp:free"; // Free fallback via OpenRouter

  // Helper to throw specific errors
  const throwQuotaError = () => { throw new Error("429_QUOTA"); };

  try {
    switch (modelProvider) {
      case 'gemini':
        try {
            // Priority 1: Gemini Direct
            const model = genAI.getGenerativeModel({ model: MODEL_GEMINI });
            const result = await model.generateContent(fullPrompt);
            return result.response.text();
        } catch (geminiError: any) {
             console.warn("Gemini Primary Failed:", geminiError);
             
             // Priority 2: Try Gemini Fallback (1.5)
             try {
                const modelFallback = genAI.getGenerativeModel({ model: MODEL_GEMINI_FALLBACK });
                const result = await modelFallback.generateContent(fullPrompt);
                return result.response.text();
             } catch (geminiFallbackError) {
                 console.warn("Gemini Fallback Failed. Switching to OpenRouter...", geminiFallbackError);
                 
                 // Priority 3: Auto-switch to OpenRouter (GPT-OSS)
                 try {
                     const orResponse = await openRouter.chat.completions.create({
                        model: MODEL_OPENROUTER_PRIMARY,
                        messages: [{ role: "user", content: fullPrompt }],
                      });
                      return orResponse.choices[0].message.content || "No response.";
                 } catch (orError) {
                     // If everything fails, throw Quota error to trigger Offline Mode
                     throwQuotaError();
                 }
             }
        }
        break;

      case 'openrouter':
        try {
          const orResponse = await openRouter.chat.completions.create({
            model: MODEL_OPENROUTER_PRIMARY,
            messages: [{ role: "user", content: fullPrompt }],
          });
          return orResponse.choices[0].message.content || "No response.";
        } catch (e) {
          console.warn("OpenRouter Primary Failed, switching to fallback...", e);
          try {
              const fallback = await openRouter.chat.completions.create({
                model: MODEL_OPENROUTER_FALLBACK, 
                messages: [{ role: "user", content: fullPrompt }],
              });
              return fallback.choices[0].message.content || "No response (Fallback).";
          } catch (finalError) {
              throwQuotaError();
          }
        }
        break;

      case 'deepseek':
        try {
            const dsResponse = await deepSeek.chat.completions.create({
              model: "deepseek-chat",
              messages: [{ role: "user", content: fullPrompt }],
            });
            return dsResponse.choices[0].message.content || "No response.";
        } catch(e) { throwQuotaError(); }
        break;

      case 'kimi':
         try {
            const kimiResponse = await moonshot.chat.completions.create({
              model: "moonshot-v1-8k",
              messages: [{ role: "user", content: fullPrompt }],
            });
            return kimiResponse.choices[0].message.content || "No response.";
         } catch(e) { throwQuotaError(); }
         break;

      default:
        throw new Error("Invalid Model");
    }
  } catch (error: any) {
    console.error(`AI Service Error [${modelProvider}]:`, error);

    // If we specifically threw a Quota error, propagate it cleanly
    if (error.message === '429_QUOTA' || error.message.includes('429') || error.message.includes('quota')) {
        toast.error("AI Busy: High traffic. Switched to Offline.");
        throw new Error("429_QUOTA"); // Use this string to trigger offline mode in UI
    }
    
    // Other errors
    if (error?.message?.includes('401') || error?.message?.includes('API key')) {
        toast.error("Connection Error: Invalid API Key");
    } else {
        toast.error("Connection Failed. Trying Offline Mode.");
    }
    throw error; 
  }
  
  return "Error"; // Should not reach here
};
