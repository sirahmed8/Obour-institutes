import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Trash2, Check, CheckCircle, Clock, Paperclip, Send, X, Search, MoreVertical, Smile, Reply } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatService } from '../../../services/chatService';
import { Conversation, Message, ResourceType } from '../../../types';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { DBService } from '../../../services/storage';
import { Subject } from '../../../types';

// Emoji Picker (Simulated or Lightweight)
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥'];

interface InboxProps {
    subjects?: Subject[]; 
}

export const Inbox: React.FC<InboxProps> = ({ subjects = [] }) => {
    // --- State ---
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    
    // Modals
    const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);
    const [showPromoteModal, setShowPromoteModal] = useState(false); // Kept for future use if needed, though hidden for now per new design focus
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Effects ---

    // 1. Subscribe to Conversations (Left Sidebar)
    useEffect(() => {
        const unsubscribe = chatService.subscribeToAllConversations((convs) => {
            setConversations(convs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 2. Subscribe to Messages (Right Chat Window)
    useEffect(() => {
        if (!selectedConvId) {
            setMessages([]);
            return;
        }

        const unsubscribe = chatService.subscribeToMessages(selectedConvId, (msgs) => {
            setMessages(msgs);
            // Auto scroll to bottom
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            
            // Auto mark as seen
            chatService.markAsSeen(selectedConvId, 'admin');
        });

        return () => unsubscribe();
    }, [selectedConvId]);

    // --- Handlers ---

    const handleSendMessage = async () => {
        if (!inputText.trim() || !selectedConvId) return;

        try {
            const selectedConv = conversations.find(c => c.id === selectedConvId);
            await chatService.sendMessage(
                selectedConvId,
                'admin',
                inputText,
                'admin@obour.edu',
                undefined,
                replyingTo ? { id: replyingTo.id, text: replyingTo.text, sender: replyingTo.senderId } : undefined
            );
            setInputText('');
            setReplyingTo(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to send");
        }
    };

    const handleDeleteMessage = async () => {
        if (!deleteMsgId || !selectedConvId) return;
        try {
            await chatService.deleteMessage(selectedConvId, deleteMsgId);
            toast.success("Message deleted");
            setDeleteMsgId(null);
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const handleReaction = async (msgId: string, emoji: string) => {
        if (!selectedConvId) return;
        await chatService.toggleReaction(selectedConvId, msgId, 'admin', emoji);
        setShowEmojiPicker(false);
    };

    // Filter conversations
    const filteredConvs = conversations.filter(c => 
        c.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedConversation = conversations.find(c => c.id === selectedConvId);

    // --- Icon Helper ---
    const StatusIcon = ({ status }: { status: Message['status'] }) => {
        if (status === 'seen') return <div className="flex"><Check size={14} className="text-blue-500"/><Check size={14} className="text-blue-500 -ml-2"/></div>;
        if (status === 'delivered') return <div className="flex"><Check size={14} className="text-gray-400"/><Check size={14} className="text-gray-400 -ml-2"/></div>;
        return <Check size={14} className="text-gray-300"/>; // Sent
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] gap-6 relative overflow-hidden">
            {/* Delete Modal */}
            <ConfirmationModal 
                isOpen={!!deleteMsgId}
                onClose={() => setDeleteMsgId(null)}
                onConfirm={handleDeleteMessage}
                title="Delete Message"
                message="Are you sure? This message will be removed for everyone."
            />

            {/* --- CONVERSATION LIST (SIDEBAR) --- */}
            <div className={`w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="font-black text-xl flex items-center gap-2 text-gray-900 dark:text-white mb-4">
                        <MessageCircle className="text-indigo-500" /> Conversations
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{conversations.length}</span>
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Search students..." 
                            value={searchTerm}
                            className="w-full bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {filteredConvs.map((conv) => (
                        <div 
                            key={conv.id}
                            onClick={() => setSelectedConvId(conv.id)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border group relative flex items-center gap-4 ${
                                selectedConvId === conv.id
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent hover:border-gray-100 dark:hover:border-gray-700'
                            }`}
                        >
                            {/* Avatar */}
                            {conv.photoURL ? (
                                <img src={conv.photoURL} alt="User" className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-600" />
                            ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                                    selectedConvId === conv.id ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600'
                                }`}>
                                    {conv.displayName ? conv.displayName[0] : conv.userEmail[0].toUpperCase()}
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className={`font-bold truncate ${selectedConvId === conv.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {conv.displayName || conv.userEmail.split('@')[0]}
                                    </h4>
                                    <span className={`text-[10px] whitespace-nowrap ${selectedConvId === conv.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {conv.lastMessageTimestamp?.seconds ? new Date(conv.lastMessageTimestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    </span>
                                </div>
                                <p className={`text-sm truncate font-medium flex items-center gap-1 ${selectedConvId === conv.id ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {conv.unreadCount > 0 && selectedConvId !== conv.id && (
                                        <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0 mr-1 animate-pulse"/>
                                    )}
                                    {conv.lastMessage}
                                </p>
                            </div>
                        </div>
                    ))}
                    {filteredConvs.length === 0 && <div className="text-center py-10 text-gray-400 font-bold text-sm">No conversations found</div>}
                </div>
            </div>

            {/* --- CHAT WINDOW (RIGHT) --- */}
            <div className={`w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col relative ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConvId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden p-2 -ml-2 text-gray-500" onClick={() => setSelectedConvId(null)}>
                                    <X />
                                </button>
                                {selectedConversation?.photoURL ? (
                                    <img src={selectedConversation.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold">
                                        {selectedConversation?.displayName?.[0] || selectedConversation?.userEmail?.[0] || '?'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white leading-none">
                                        {selectedConversation?.displayName || selectedConversation?.userEmail}
                                    </h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {selectedConversation?.userEmail} 
                                    </span>
                                </div>
                            </div>
                            
                            {/* Email Instead Action */}
                             <button 
                                onClick={() => {
                                    if(selectedConversation) {
                                        const subject = encodeURIComponent("Follow-up on our chat");
                                        window.location.href = `mailto:${selectedConversation.userEmail}?subject=${subject}`;
                                    }
                                }}
                                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                Email Instead
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
                            {messages.map((msg) => {
                                const isAdmin = msg.senderId === 'admin';
                                return (
                                    <motion.div 
                                        key={msg.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[85%] ${isAdmin ? 'ml-auto' : 'mr-auto'}`}
                                    >
                                        {/* Reply Context */}
                                        {msg.replyTo && (
                                            <div className={`mb-1 px-3 py-1 rounded-lg text-xs opacity-70 border-l-2 ${isAdmin ? 'bg-indigo-100 border-indigo-400 text-indigo-800' : 'bg-gray-200 border-gray-400 text-gray-600'}`}>
                                               Replying to: {msg.replyTo.text.substring(0, 30)}...
                                            </div>
                                        )}

                                        <div className="relative group">
                                            {/* Message Bubble */}
                                            <div 
                                                className={`p-3 rounded-2xl relative ${
                                                    msg.isDeleted ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 italic' :
                                                    isAdmin 
                                                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20' 
                                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-gray-700 shadow-sm'
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                                                
                                                {/* Meta: Time & Status */}
                                                <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${isAdmin ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                    {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                                    {isAdmin && <StatusIcon status={msg.status} />}
                                                </div>

                                                {/* Reactions Display */}
                                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                    <div className="absolute -bottom-2 right-0 flex bg-white dark:bg-gray-800 rounded-full px-1 shadow border border-gray-100 dark:border-gray-600 text-xs">
                                                        {Object.entries(msg.reactions).map(([uid, emoji]) => (
                                                            <span key={uid}>{emoji}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Hover Actions */}
                                            {!msg.isDeleted && (
                                                <div className={`absolute top-0 ${isAdmin ? '-left-20' : '-right-20'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white dark:bg-gray-800 p-1 rounded-full shadow-md border border-gray-100 dark:border-gray-700`}>
                                                    <button onClick={() => setReplyingTo(msg)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500" title="Reply">
                                                        <Reply size={14} />
                                                    </button>
                                                     {/* Simple Reaction Shortcuts */}
                                                    <button onClick={() => handleReaction(msg.id, '👍')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500" title="Like">
                                                        👍
                                                    </button>
                                                    <button onClick={() => setDeleteMsgId(msg.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-500" title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 relative z-10">
                            {replyingTo && (
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-2 rounded-lg mb-2 text-xs border-l-4 border-indigo-500">
                                    <span className="truncate text-gray-500">Replying to: <b>{replyingTo.text}</b></span>
                                    <button onClick={() => setReplyingTo(null)}><X size={14}/></button>
                                </div>
                            )}

                            <div className="flex items-end gap-2">
                                <button className="p-3 text-gray-400 hover:text-indigo-600 transition-colors" title="Attach file (Coming Soon)">
                                    <Paperclip size={20} />
                                </button>
                                
                                <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all flex items-center p-1">
                                    <input 
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        className="w-full bg-transparent border-none focus:ring-0 p-3 max-h-32 min-h-[48px] text-sm text-gray-900 dark:text-white font-medium placeholder:text-gray-400 resize-none"
                                    />
                                    <button 
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-2 text-gray-400 hover:text-amber-500 transition-colors mr-1"
                                    >
                                        <Smile size={20}/>
                                    </button>
                                </div>

                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim()}
                                    className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center transform hover:-translate-y-1"
                                >
                                    <Send size={20} className={inputText.trim() ? 'ml-0.5' : ''} />
                                </motion.button>
                            </div>

                             {/* Simple Emoji Picker Popover */}
                             <AnimatePresence>
                                {showEmojiPicker && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute bottom-20 right-20 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 grid grid-cols-4 gap-2"
                                    >
                                        {EMOJIS.map(emoji => (
                                            <button 
                                                key={emoji} 
                                                onClick={() => { setInputText(prev => prev + emoji); setShowEmojiPicker(false); }}
                                                className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-xl"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30 dark:bg-gray-900/10">
                        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <MessageCircle size={40} className="text-indigo-200 dark:text-indigo-800"/>
                        </div>
                        <h3 className="text-xl font-black text-gray-300 dark:text-gray-600 mb-2">Admin Chat Hub</h3>
                        <p className="text-sm font-bold text-gray-300 dark:text-gray-600">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};
