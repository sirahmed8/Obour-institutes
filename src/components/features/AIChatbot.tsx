
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, BrainCircuit } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DBService } from '../../services/storage';
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

  // Keyboard Awareness Logic
  const [viewportHeight, setViewportHeight] = useState('100dvh');

  useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      // Create a small buffer or just use the height directly
      setViewportHeight(`${window.visualViewport!.height}px`);
    };
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport!.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && !fullContext) {
      DBService.getAllDataForAI().then(setFullContext);
    }
  }, [isOpen, fullContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const [lastMessage, setLastMessage] = useState<string>('');
  const constraintsRef = useRef(null);

  const handleSend = async (retryText?: string) => {
    const textToSend = retryText || input;
    if (!textToSend.trim()) return;

    // 1. Instantly show user message
    if (!retryText) {
       setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
       setLastMessage(textToSend); // Save for retry
       setInput('');
    }
    setLoading(true);

    try {
      // 2. Initialize AI (using @google/genai SDK pattern)
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY });

      // 3. Contextual Prompt
      const systemPrompt = `
        You are "Obour AI", a helpful academic assistant.
        CONTEXT: ${fullContext}
        Answer concisely and helpfully.
      `;
      
      // 4. Generate with CORRECT Payload Structure
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
            { 
                role: 'user', 
                parts: [{ text: systemPrompt + "\n\nUser: " + textToSend }] 
            }
        ] 
      });

      // Handle response.text() safely (SDK version variance)
      // Cast to any to bypass TS error: "expression is not callable because it is a 'get' accessor"
      const responseAny = response as any;
      const text = typeof responseAny.text === 'function' ? responseAny.text() : (responseAny.text || "I'm thinking...");
      
      setMessages((prev) => [...prev, { role: 'model', text: typeof text === 'string' ? text : "Received non-text response." }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: `**System Error**: Comparison mismatch or Network fail. details: ${error}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
     // Remove last system error message
     setMessages(prev => prev.filter(m => !m.text.includes('System Error')));
     // Retry last message
     if (lastMessage) { 
         handleSend(lastMessage);
     }
  };

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-50" ref={constraintsRef} />
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.button
            key="chatbot-fab"
            layout // Enable layout animation for smooth position changes
            drag
            dragConstraints={constraintsRef}
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 pointer-events-auto p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-[0_10px_30px_-10px_rgba(79,70,229,0.6)] flex items-center justify-center transition-shadow animate-breath hover:shadow-indigo-500/50 cursor-grab active:cursor-grabbing"
          >
            <BrainCircuit size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatbot-window"
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.05}
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{ 
              height: window.innerWidth < 768 ? viewportHeight : '600px',
              // Use fixed positioning but valid standard CSS for initial placement
              // The drag will use transform
              position: 'fixed',
              bottom: window.innerWidth < 768 ? 0 : '1.5rem',
              right: window.innerWidth < 768 ? 0 : '1.5rem',
              width: window.innerWidth < 768 ? '100%' : '400px',
              borderRadius: window.innerWidth < 768 ? '0' : '2rem'
            }}
            className="pointer-events-auto bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-0 md:border border-indigo-50 dark:border-gray-800 overflow-hidden cursor-move"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 md:p-5 flex justify-between items-center text-white shrink-0 shadow-md z-10 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"><Bot size={24} /></div>
                <div>
                    <h3 className="font-black text-lg leading-tight">Obour AI</h3>
                    <p className="text-[10px] uppercase font-bold opacity-80 tracking-widest">Study Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors focus:bg-white/30 active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50 dark:bg-gray-950/50 custom-scrollbar scroll-smooth">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm relative ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700'
                  }`}>
                      {msg.text.includes('System Error') ? (
                          <div className="flex flex-col gap-2">
                              <span className="flex items-center gap-2 text-red-200"><span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"/> Connection Failed</span>
                              <p>{msg.text.replace('**System Error**: ', '')}</p>
                              <button 
                                onClick={handleRetry}
                                className="mt-2 text-xs bg-white text-indigo-600 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors w-fit self-start"
                              >
                                Retry Connection
                              </button>
                          </div>
                      ) : (
                        <Markdown className="prose prose-sm dark:prose-invert break-words leading-relaxed text-inherit">
                          {msg.text}
                        </Markdown>
                      )}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                 <div className="flex justify-start">
                   <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex gap-1.5">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                      </div>
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 md:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-3 shrink-0 pb-safe shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)] z-20">
              <input
                type="text"
                autoFocus={window.innerWidth >= 768}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your question..."
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium placeholder-gray-400 transition-all"
              />
              <motion.button 
                onClick={() => handleSend()} 
                disabled={!input.trim() || loading} 
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center disabled:opacity-50 disabled:shadow-none transition-all shrink-0"
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
