
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, X, BrainCircuit, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DBService } from '../services/storage';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm **Obour AI**, your specialized study assistant. I'm here to help you navigate courses, summarize lecture notes, and find relevant study material. What can I do for you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullContext, setFullContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !fullContext) {
      DBService.getAllDataForAI().then(setFullContext);
    }
  }, [isOpen, fullContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemPrompt = `
        You are "Obour AI", a world-class academic assistant for the Obour Institutes Platform.
        
        INTERNAL KNOWLEDGE BASE:
        ${fullContext}
        
        TASK:
        1. Assist students in finding specific subjects or resources mentioned in the KNOWLEDGE BASE.
        2. Summarize academic topics concisely using ONLY the provided context if possible.
        3. Use 'googleSearch' ONLY if the information is not in the internal knowledge base or if the student asks for real-world examples/latest tech news.
        4. Citations: If you mention a specific resource from Obour Institutes, format it as a bold title.
        
        TONE:
        Professional, encouraging, academic, and highly accurate. Do not hallucinate resources that don't exist in the context.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: systemPrompt + `\n\nStudent: ${userMsg}`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      let text = response.text || "I'm having trouble processing that. Could you try rephrasing your question?";
      
      // Handle potential search grounding URLs
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          const links = response.candidates[0].groundingMetadata.groundingChunks
            .map((chunk: any) => chunk.web ? `- [${chunk.web.title}](${chunk.web.uri})` : null)
            .filter(Boolean);
          if (links.length > 0) {
              text += "\n\n**Related Web Resources:**\n" + links.join('\n');
          }
      }

      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `**System Error**: I'm unable to connect right now. Please check your internet connection.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 z-50 p-5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-[0_15px_40px_-10px_rgba(79,70,229,0.5)] flex items-center justify-center"
          >
            <BrainCircuit size={32} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100, x: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100, x: 50 }}
            className="fixed bottom-8 right-8 z-50 w-[95%] md:w-[420px] h-[650px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl flex flex-col border border-indigo-50 dark:border-gray-800 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><Bot size={24} /></div>
                <div>
                    <h3 className="font-black text-lg">Obour AI</h3>
                    <p className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Study Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-950/20 custom-scrollbar">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-3xl px-5 py-3.5 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700'
                  }`}>
                    <Markdown className="prose prose-sm dark:prose-invert break-words">
                      {msg.text}
                    </Markdown>
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                 <div className="flex justify-start">
                   <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex gap-2">
                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2.5 h-2.5 bg-indigo-400 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                      </div>
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-3 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Explain the Data Structures lecture..."
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full px-6 py-4 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-medium placeholder-gray-400"
              />
              <motion.button 
                onClick={handleSend} 
                disabled={!input.trim() || loading} 
                whileTap={{ scale: 0.9 }} 
                className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 transition-colors shrink-0"
              >
                <Send size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
