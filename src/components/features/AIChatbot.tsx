
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Bot, Send, X, Wifi, WifiOff, Paperclip, Shield, Sparkles, ChevronDown, Cpu, Lock, Brain, Globe, MessageSquare, Trash2 } from 'lucide-react';
import { DBService } from '../../services/storage';
import { getOfflineResponse } from '../../services/offlineChatbot';
import Markdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import { generateAIResponse, AIModel } from '../../services/aiService';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'; 
import { db } from '../../services/firebase';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChatbot: React.FC = () => {
  const { currentUser } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "أهلاً بك في مساعد معهد العبور الذكي 👋 \n\nيمكنني مساعدتك في العثور على الدورات، وتلخيص الملاحظات، أو الإجابة على أسئلة حول المعهد. \n\n*قم بالتبديل إلى 'Online Mode' للحصول على إجابات مدعومة بالذكاء الاصطناعي!*" }
  ]);
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

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (!window.visualViewport) return;
    
    const handleResize = () => {
      const viewportHeight = window.visualViewport!.height;
      const windowHeight = window.innerHeight;
      const newKeyboardHeight = windowHeight - viewportHeight;
      setKeyboardHeight(Math.max(0, newKeyboardHeight));
    };
    
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    return () => {
      window.visualViewport!.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem('chatbot_mode') as 'online' | 'offline' | 'admin' | null;
    const savedModel = localStorage.getItem('ai_model') as AIModel | null;
    
    if (savedMode) setChatbotMode(savedMode);
    else setChatbotMode('offline');

    if (savedModel) setSelectedModel(savedModel);

    const savedMessages = localStorage.getItem('chat_history');
    if (savedMessages) {
        try {
            setMessages(JSON.parse(savedMessages));
        } catch (e) { console.error("History load failed", e); }
    }
  }, []);

  useEffect(() => {
      if (!currentUser) return;
      
      // Listen for Admin Replies (Support Mode)
      // Even if not in admin mode, we might want to see notifications or switch mode?
      // For now, let's append them if they arrive.
      const q = query(
          collection(db, 'users', currentUser.uid, 'messages'),
          orderBy('timestamp', 'asc'),
          limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
          const newMsgs = snapshot.docs.map(d => d.data());
          // Merge with local messages? 
          // Actually, if we are using this logic, we should probably sync ALL messages with Firestore if in Admin Mode.
          // But to avoid rewriting the entire local-storage logic which users like for offline privacy:
          // We will just append NEW admin messages that we haven't seen.
          // Or, simple Hack: If we receive a message from 'model' that isSupportReply, show it.
          
          // Better: If in Admin Mode, show Firestore messages primarily?
          // The user wants "Admin <-> User Chat Logic" fixed.
          
          snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                  const data = change.doc.data();
                  // Avoid duplicating our own messages if we synced them (we currently don't sync user messages to this collection, only inbox)
                  // The Admin writes to this collection.
                  if (data.isSupportReply) {
                      setMessages(prev => {
                          // Dedup check
                          if (prev.some(m => m.text === data.text)) return prev;
                          return [...prev, { role: 'model', text: `📩 **Support Team:**\n\n${data.text}` }];
                      });
                      // If not in admin mode, maybe alert?
                      if (chatbotMode !== 'admin') {
                           toast("New Support Message Received", { icon: '💬' });
                      }
                  }
              }
          });
      });
      return () => unsubscribe();
  }, [currentUser, chatbotMode]);

  useEffect(() => {
    if (messages.length > 0) { 
        localStorage.setItem('chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const changeMode = (mode: 'online' | 'offline' | 'admin') => {
    setChatbotMode(mode);
    localStorage.setItem('chatbot_mode', mode);
    setShowModelMenu(false);

    if (mode === 'admin') {
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || !lastMsg.text.includes('Support Mode Activated')) {
             setMessages(prev => [...prev, { role: 'model', text: "Support Mode Activated 🛡️\n\nHow can we help? Your messages will be sent directly to the institute administration." }]);
        }
    } else {
         const modeName = mode === 'online' ? 'Online AI' : 'Offline AI';
         setMessages(prev => [...prev, { role: 'model', text: `Switched to **${modeName}** mode.` }]);
    }
  };

  const handleModelChange = (model: AIModel) => {
      setSelectedModel(model);
      localStorage.setItem('ai_model', model);
      setShowModelMenu(false);
      
      let modelName = 'Gemini';
      if (model === 'openrouter') modelName = 'GPT-OSS (Free)';
      if (model === 'deepseek') modelName = 'DeepSeek V3';
      if (model === 'kimi') modelName = 'Kimi AI';

      setMessages(prev => [...prev, { role: 'model', text: `AI Model switched to **${modelName}**.` }]);
  };

  useEffect(() => {
    if (isOpen && !fullContext && chatbotMode !== 'admin') {
      DBService.getAllDataForAI().then(setFullContext);
    }
  }, [isOpen, fullContext, chatbotMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
          const result = await DBService.uploadFile(file);
          const text = `Attached File: [${file.name}](${result.url})`;
          setMessages(prev => [...prev, { role: 'user', text }]);
          
          if (chatbotMode === 'admin') {
              await DBService.sendInboxMessage(
                  currentUser?.uid || 'guest', 
                  currentUser?.email || 'guest@obour.edu', 
                  text,
                  [{ url: result.url, type: result.format }]
              );
              setTimeout(() => {
                 setMessages(prev => [...prev, { role: 'model', text: "File sent to admin." }]);
              }, 500);
          } else {
              setTimeout(() => {
                  setMessages(prev => [...prev, { role: 'model', text: "I've received your file. While I can't analyze it directly yet, I've noted it." }]);
              }, 1000);
          }
      } catch (error) {
          console.error(error);
          setMessages(prev => [...prev, { role: 'model', text: "⚠️ Failed to upload file." }]);
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleSend = async (retryText?: string) => {
    const textToSend = retryText || input;
    if (!textToSend.trim()) return;

    if (!retryText) {
       setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
       setInput('');
    }
    setLoading(true);

    if (chatbotMode === 'admin') {
        try {
            await DBService.sendInboxMessage(
                currentUser?.uid || 'guest', 
                currentUser?.email || 'guest@obour.edu', 
                textToSend
            ); 
            await new Promise(resolve => setTimeout(resolve, 800));
            setMessages((prev) => [...prev, { role: 'model', text: "Message sent to administration. We'll get back to you shortly!" }]);
        } catch (e) {
            setMessages((prev) => [...prev, { role: 'model', text: "⚠️ Failed to send message. Please try again." }]);
        } finally {
            setLoading(false);
        }
        return;
    }

    if (chatbotMode === 'offline') {
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = getOfflineResponse(textToSend);
      setMessages((prev) => [...prev, { role: 'model', text: response }]);
      setLoading(false);
      return;
    }

    try {
        const responseText = await generateAIResponse(textToSend, fullContext, selectedModel);
        setMessages((prev) => [...prev, { role: 'model', text: responseText }]);
    } catch (error: any) {
      console.error("AI Error:", error);
       let errorMsg = `⚠️ **Connection Issue**\n\n`;
       if (error?.message === '429_QUOTA' || error?.message?.includes('429_QUOTA')) {
          errorMsg += `I'm currently overloaded. 😓\n\nSwitched to **Offline Mode** automatically. I can still help with basic questions!`;
          setChatbotMode('offline'); 
       } else {
          const offlineResponse = getOfflineResponse(textToSend);
          errorMsg += `I couldn't reach the cloud. Here is what I found in my local database:\n\n${offlineResponse}`;
       }
       setMessages((prev) => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const getModelLabel = () => {
    if (chatbotMode === 'admin') return 'Support';
    if (chatbotMode === 'offline') return 'Offline';
    switch (selectedModel) {
        case 'gemini': return 'Gemini';
        case 'openrouter': return 'GPT-OSS';
        case 'deepseek': return 'DeepSeek';
        case 'kimi': return 'Kimi AI';
        default: return 'Gemini';
    }
  };

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
            className="fixed bottom-6 right-6 z-[9999] pointer-events-auto p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-[0_10px_30px_-10px_rgba(79,70,229,0.6)] flex items-center justify-center transition-shadow animate-breath hover:shadow-indigo-500/80 hover:ring-4 hover:ring-indigo-300 dark:hover:ring-indigo-900 mb-16 md:mb-0"
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
            dragElastic={0.05}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{ 
              height: isMobile ? '85dvh' : '650px',
              position: 'fixed',
              bottom: isMobile ? '6rem' : '1.5rem', // bottom-24 is 6rem
              right: isMobile ? '0' : '1.5rem',
              top: 'auto',
              width: isMobile ? '100%' : '420px',
              borderRadius: isMobile ? '1.5rem 1.5rem 0 0' : '2rem',
              transformOrigin: 'bottom right',
              paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : '0'
            }}
            className="pointer-events-auto bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl flex flex-col border-0 md:border border-indigo-50 dark:border-white/10 overflow-hidden z-[9999] fixed-ios-input"
            dir="auto"
          >
            {/* Header */}
            <motion.div 
              onPointerDown={(e) => !isMobile && dragControls.start(e)}
              className={`p-4 md:p-5 flex justify-between items-center text-white shrink-0 shadow-md z-10 cursor-grab active:cursor-grabbing select-none transition-colors duration-500 ${
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
                      {chatbotMode === 'admin' ? 'Support' : 'Obour AI'}
                      <div className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                          chatbotMode === 'offline' ? 'bg-amber-400/30 text-amber-100' : 
                          chatbotMode === 'admin' ? 'bg-gray-500/30 text-gray-200' : 
                          'bg-emerald-400/30 text-emerald-100'
                        }`}
                      >
                        {chatbotMode === 'offline' ? <WifiOff size={10} /> : chatbotMode === 'admin' ? <Shield size={10}/> : <Wifi size={10} />}
                        {getModelLabel()}
                      </div>
                    </h3>
                    <p className="text-[10px] uppercase font-bold opacity-80 tracking-widest">
                        {chatbotMode === 'admin' ? 'Direct Message' : 'Central AI Hub'}
                    </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                  <button 
                      onClick={() => setShowClearConfirm(true)}
                      className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors focus:bg-white/30 active:scale-95"
                      title="Clear History"
                  >
                      <Trash2 size={16} />
                  </button>
                  <button 
                      onClick={() => setIsOpen(false)} 
                      className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors focus:bg-white/30 active:scale-95"
                  >
                      <X size={20} />
                  </button>
              </div>
            </motion.div>

            {/* Content Area - Gated by Auth */}
            {!currentUser ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                      <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white mb-2">Login Required</h3>
                  <p className="text-gray-500 text-sm mb-6">You need to sign in to chat with Obour AI.</p>
                  <p className="text-xs text-indigo-500 font-bold">Please log in securely with your Google account.</p>
              </div>
            ) : (
              <>
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
                      <Markdown className="prose prose-sm dark:prose-invert break-words leading-relaxed text-inherit">
                        {msg.text}
                      </Markdown>
                  </div>
                </motion.div>
              ))}
              {loading && (
                 <div className="flex justify-start">
                   <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700 flex gap-1.5">
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Config & Input Area */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 z-20">
                {/* Advanced Settings Bar (Bottom) */}
                <div className="px-4 py-2 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
                    <div className="flex gap-2">
                         {/* Mode Switcher */}
                         <div className="relative">
                            <button
                                onClick={() => setShowModelMenu(!showModelMenu)}
                                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                {chatbotMode === 'admin' ? <Shield size={14} /> : chatbotMode === 'offline' ? <WifiOff size={14} /> : <Sparkles size={14} />}
                                {getModelLabel()}
                                <ChevronDown size={12} />
                            </button>
                            
                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {showModelMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden p-1.5 z-50"
                                    >
                                        <button onClick={() => { changeMode('online'); handleModelChange('gemini'); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${selectedModel === 'gemini' && chatbotMode === 'online' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            <Sparkles size={14} className="text-indigo-500"/> Gemini 2.5
                                        </button>
                                        
                                        <button onClick={() => { changeMode('online'); handleModelChange('openrouter'); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${selectedModel === 'openrouter' && chatbotMode === 'online' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            <Globe size={14} className="text-blue-500"/> GPT-OSS (Free)
                                        </button>

                                        <button onClick={() => { changeMode('online'); handleModelChange('deepseek'); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${selectedModel === 'deepseek' && chatbotMode === 'online' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            <Brain size={14} className="text-purple-500"/> DeepSeek V3
                                        </button>

                                        <button onClick={() => { changeMode('online'); handleModelChange('kimi'); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${selectedModel === 'kimi' && chatbotMode === 'online' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            <MessageSquare size={14} className="text-pink-500"/> Kimi AI
                                        </button>
                                        
                                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"/>
                                        <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">System</p>
                                        
                                        <button onClick={() => changeMode('offline')} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${chatbotMode === 'offline' ? 'bg-amber-50 text-amber-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            <WifiOff size={14} className="text-amber-500"/> Offline Mode
                                        </button>
                                        <button onClick={() => changeMode('admin')} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${chatbotMode === 'admin' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            <Shield size={14} className="text-gray-500"/> Contact Support
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                         </div>
                    </div>
                </div>

                {/* Input Field */}
                <motion.div 
                  layout
                  className="p-3 md:p-4 flex gap-3 items-end sticky bottom-0 pb-safe"
                >
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                  />
                  <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || isUploading}
                      className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Upload file (Image or PDF)"
                  >
                      {isUploading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"/> : <Paperclip size={20} />}
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    autoFocus={!isMobile}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={chatbotMode === 'admin' ? "Message details..." : `Ask ${getModelLabel()}...`}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-medium placeholder-gray-400 transition-all"
                  />
                  <motion.button 
                    onClick={() => handleSend()} 
                    disabled={!input.trim() || loading} 
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 text-white rounded-2xl shadow-lg flex items-center justify-center disabled:opacity-50 disabled:shadow-none transition-all shrink-0 ${
                        chatbotMode === 'admin'
                        ? 'bg-gray-800 hover:bg-gray-900 shadow-gray-500/30'
                        : selectedModel === 'openrouter'
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-blue-500/30'
                        : selectedModel === 'deepseek'
                        ? 'bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-purple-500/30'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30'
                    }`}
                  >
                    <Send size={20} />
                  </motion.button>
                </motion.div>
            </div>
              </>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
         isOpen={showClearConfirm}
         onClose={() => setShowClearConfirm(false)}
         onConfirm={() => {
             localStorage.removeItem('chat_history');
             setMessages([{ role: 'model', text: "Chat history cleared. How can I help you now? ✨" }]);
             setShowClearConfirm(false);
         }}
         title="Clear History?"
         message="Are you sure you want to delete your entire conversation history? This cannot be undone."
      />
    </>
  );
};
