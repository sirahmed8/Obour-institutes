
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Bot, Send, X, Wifi, WifiOff, Paperclip, Shield, Sparkles, ChevronDown, Lock, Check } from 'lucide-react';
import { DBService } from '../../services/storage';
import { getOfflineResponse } from '../../services/offlineChatbot';
import Markdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { generateAIResponse, AIModel } from '../../services/aiService';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { chatService } from '../../services/chatService';
import { Message } from '../../types';

// Emoji Picker (Simulated)
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

export const AIChatbot: React.FC = () => {
  const { currentUser } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  // Local messages for AI flow, but we overlay Admin messages from ChatService
  const [localMessages, setLocalMessages] = useState<any[]>([
    { role: 'model', text: "أهلاً بك في مساعد معهد العبور الذكي 👋 \n\nيمكنني مساعدتك في العثور على الدورات، وتلخيص الملاحظات، أو الإجابة على أسئلة حول المعهد. \n\n*قم بالتبديل إلى 'Online Mode' للحصول على إجابات مدعومة بالذكاء الاصطناعي!*" }
  ]);
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullContext, setFullContext] = useState<string>('');
  const [chatbotMode, setChatbotMode] = useState<'online' | 'offline' | 'admin'>('offline');
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
  const [showModelMenu, setShowModelMenu] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // --- PERSISTENCE & INIT ---

  useEffect(() => {
    const savedMode = localStorage.getItem('chatbot_mode') as 'online' | 'offline' | 'admin' | null;
    const savedModel = localStorage.getItem('ai_model') as AIModel | null;
    const clearedTimestamp = localStorage.getItem('chat_cleared_timestamp');
    
    if (savedMode) setChatbotMode(savedMode);
    if (savedModel) setSelectedModel(savedModel);

    const savedMessages = localStorage.getItem('chat_history');
    if (savedMessages) {
        try {
            setLocalMessages(JSON.parse(savedMessages));
        } catch (e) { console.error("History load failed", e); }
    }
  }, []);

  // Save AI history locally
  useEffect(() => {
    if (localMessages.length > 0) { 
        localStorage.setItem('chat_history', JSON.stringify(localMessages));
    }
  }, [localMessages]);


  // --- ADMIN MODE SYNC ---
  useEffect(() => {
      if (!currentUser || chatbotMode !== 'admin') return;

      const unsubscribe = chatService.subscribeToMessages(currentUser.uid, (msgs) => {
          // Filter if history was cleared? 
          // Implementation: The user only wants to see messages after "Clear History".
          // However, Admin persistence requires the messages to stay in DB.
          // Filter on client side based on 'chat_cleared_timestamp'
          const clearedTime = localStorage.getItem('chat_cleared_timestamp');
          let filtered = msgs;
          if (clearedTime) {
             filtered = msgs.filter(m => m.timestamp?.seconds * 1000 > parseInt(clearedTime));
          }
          setAdminMessages(filtered);
          
          // Mark admin messages as seen by user
          chatService.markAsSeen(currentUser.uid, 'user');
      });

      return () => unsubscribe();
  }, [currentUser, chatbotMode]);


  // --- HANDLERS ---

  const changeMode = (mode: 'online' | 'offline' | 'admin') => {
    setChatbotMode(mode);
    localStorage.setItem('chatbot_mode', mode);
    setShowModelMenu(false);

    if (mode === 'admin') {
         // Maybe show a "Connected to Support" banner
    } else {
         // Switch back to AI messages
    }
  };

  const handleSend = async (retryText?: string) => {
    const textToSend = retryText || input;
    if (!textToSend.trim()) return;

    if (!retryText) setInput('');

    // --- ADMIN MODE ---
    if (chatbotMode === 'admin') {
        if (!currentUser) return toast.error("Please login first");
        
        try {
            await chatService.sendMessage(
                currentUser.uid,
                currentUser.uid, // User is sender
                textToSend,
                currentUser.email || 'unknown',
                { displayName: currentUser.displayName, photoURL: currentUser.photoURL }
            );
            // No need to set local state, valid messages arrive via subscription!
        } catch (e: any) {
            toast.error(e.message || "Failed to send");
        }
        return;
    }

    // --- AI MODES ---
    setLocalMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    if (chatbotMode === 'offline') {
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = getOfflineResponse(textToSend);
      setLocalMessages((prev) => [...prev, { role: 'model', text: response }]);
      setLoading(false);
      return;
    }

    try {
        if (!fullContext) { // Lazy load context
           const ctx = await DBService.getAllDataForAI(); 
           setFullContext(ctx);
        }
        const responseText = await generateAIResponse(textToSend, fullContext, selectedModel);
        setLocalMessages((prev) => [...prev, { role: 'model', text: responseText }]);
    } catch (error: any) {
        setLocalMessages((prev) => [...prev, { role: 'model', text: "⚠️ I encountered an error connecting to the AI." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
      if (chatbotMode === 'admin') {
          // Soft clear for user
          localStorage.setItem('chat_cleared_timestamp', Date.now().toString());
          setAdminMessages([]);
      } else {
          setLocalMessages([{ role: 'model', text: "Chat history cleared. How can I help you now? ✨" }]);
      }
      setShowClearConfirm(false);
  };

  // --- RENDER HELPERS ---
  
  const displayMessages = chatbotMode === 'admin' 
    ? adminMessages.map(m => ({
        role: m.senderId === 'admin' ? 'model' : 'user',
        text: m.text,
        status: m.status,
        timestamp: m.timestamp
      }))
    : localMessages;

  const getModelLabel = () => {
    if (chatbotMode === 'admin') return 'Support';
    if (chatbotMode === 'offline') return 'Offline';
    return selectedModel === 'openrouter' ? 'GPT-OSS' : selectedModel === 'deepseek' ? 'DeepSeek' : 'Gemini';
  };
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, adminMessages, isOpen]);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-50" ref={constraintsRef} />
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.button
            key="chatbot-fab"
            layout
            whileHover={{ scale: 1.2, rotate: -10 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9999] pointer-events-auto p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-[0_10px_30px_-10px_rgba(79,70,229,0.6)] flex items-center justify-center transition-shadow animate-breath hover:shadow-indigo-500/80 hover:ring-4 hover:ring-indigo-300 mb-16 md:mb-0"
          >
            <Bot size={32} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatbot-window"
            drag={!isMobile}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={constraintsRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{ 
              height: isMobile ? '85dvh' : '650px',
              position: 'fixed',
              bottom: isMobile ? '6rem' : '1.5rem',
              right: isMobile ? '0' : '1.5rem',
              width: isMobile ? '100%' : '420px',
              borderRadius: isMobile ? '1.5rem 1.5rem 0 0' : '2rem',
            }}
            className="pointer-events-auto bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl flex flex-col border-0 md:border border-indigo-50 dark:border-white/10 overflow-hidden z-[9999]"
          >
            {/* Header */}
            <motion.div 
              onPointerDown={(e) => !isMobile && dragControls.start(e)}
              className={`p-4 md:p-5 flex justify-between items-center text-white shrink-0 shadow-md cursor-grab active:cursor-grabbing select-none ${
                  chatbotMode === 'admin' 
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600'
              }`}
            >
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    {chatbotMode === 'admin' ? <Shield size={24} /> : <Bot size={24} />}
                </div>
                <div>
                    <h3 className="font-black text-lg leading-tight flex items-center gap-2">
                      {chatbotMode === 'admin' ? 'Live Support' : 'Obour AI'}
                      <div className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-white/20`}>
                        {chatbotMode === 'offline' ? <WifiOff size={10} /> : chatbotMode === 'admin' ? <Shield size={10}/> : <Wifi size={10} />}
                        {getModelLabel()}
                      </div>
                    </h3>
                </div>
              </div>
              <div className="flex items-center gap-1">
                  <button onClick={() => setShowClearConfirm(true)} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
                      <Bot size={16} className="rotate-180"/> {/* Clear Icon */}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
                      <X size={20} />
                  </button>
              </div>
            </motion.div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950/50 custom-scrollbar scroll-smooth">
              {!currentUser && chatbotMode === 'admin' ? (
                   <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                       <Lock size={32} className="mb-2"/>
                       <p className="font-bold">Login required for support chat</p>
                   </div>
              ) : (
                  displayMessages.map((msg, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm relative Group ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700'
                      }`}>
                          <Markdown className="prose prose-sm dark:prose-invert break-words leading-relaxed text-inherit">
                            {msg.text}
                          </Markdown>
                          {/* Status Icons for User Messages in Admin Mode */}
                          {chatbotMode === 'admin' && msg.role === 'user' && (
                              <div className="flex justify-end mt-1 opacity-70">
                                  {msg.status === 'seen' ? <div className="flex text-blue-200"><Check size={12}/><Check size={12} className="-ml-1"/></div> :
                                   msg.status === 'delivered' ? <div className="flex text-gray-300"><Check size={12}/><Check size={12} className="-ml-1"/></div> :
                                   <Check size={12} className="text-gray-300"/>}
                              </div>
                          )}
                      </div>
                    </motion.div>
                  ))
              )}
               {loading && (
                 <div className="flex justify-start">
                   <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-bl-none shadow-sm flex gap-1.5 w-16 items-center justify-center">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3">
                 {/* Mode Selector */}
                 <div className="flex justify-between items-center px-1 mb-2">
                     <button
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                     >
                        {chatbotMode === 'admin' ? <Shield size={12} /> : <Sparkles size={12} />}
                        {getModelLabel()}
                        <ChevronDown size={12} />
                     </button>
                     
                     <AnimatePresence>
                        {showModelMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-16 left-4 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden p-1.5 z-50"
                            > 
                                <button onClick={() => changeMode('online')} className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs font-bold flex gap-2"><Sparkles size={14}/> AI Assistant</button>
                                <button onClick={() => changeMode('admin')} className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs font-bold flex gap-2"><Shield size={14}/> Live Support</button>
                                <button onClick={() => changeMode('offline')} className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs font-bold flex gap-2"><WifiOff size={14}/> Offline Mode</button>
                            </motion.div>
                        )}
                     </AnimatePresence>
                 </div>

                 <div className="flex gap-2 items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={chatbotMode === 'admin' ? "Message support..." : "Ask me anything..."}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium"
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim()}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/30"
                    >
                        <Send size={20} />
                    </button>
                 </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
         isOpen={showClearConfirm}
         onClose={() => setShowClearConfirm(false)}
         onConfirm={handleClearHistory}
         title="Clear History?"
         message="Are you sure you want to delete your conversation history? This cannot be undone."
      />
    </>
  );
};
