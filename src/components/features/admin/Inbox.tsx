import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Trash2, Check, Archive, Paperclip, Mail, Shield, User, FileText, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { DBService } from '../../../services/storage';
import { Subject, ResourceType } from '../../../types';
import { ConfirmationModal } from '../../ui/ConfirmationModal';

interface InboxProps {
    subjects?: Subject[];
}

export const Inbox: React.FC<InboxProps> = ({ subjects = [] }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<any>(null);

    // Promote Modal State
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [attachmentToPromote, setAttachmentToPromote] = useState<{url: string, type: string, name?: string} | null>(null);
    const [promoteSubjectId, setPromoteSubjectId] = useState('');
    const [promoteTitle, setPromoteTitle] = useState('');
    const [promoteDescription, setPromoteDescription] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isPromoting, setIsPromoting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'inbox'), orderBy('timestamp', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const markAsRead = async (id: string, currentStatus: boolean) => {
        if (currentStatus) return;
        try {
            await updateDoc(doc(db, 'inbox', id), { read: true });
            toast.success('Marked as read');
        } catch (e) { console.error(e); }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteDoc(doc(db, 'inbox', deleteId));
            toast.success('Message deleted');
            if (selectedMessage?.id === deleteId) setSelectedMessage(null);
        } catch (e) { toast.error('Failed to delete'); }
        setDeleteId(null);
    };

    const handlePromoteClick = (att: any, index: number) => {
        setAttachmentToPromote({
            url: att.url,
            type: att.type || 'FILE',
            name: `User Upload ${index + 1}`
        });
        setPromoteTitle(`User Resource: ${att.type || 'File'}`);
        setPromoteDescription(`Contributed by ${selectedMessage?.userEmail}`);
        setShowPromoteModal(true);
    };

    const handlePromoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoteSubjectId) return toast.error("Select a subject");
        if (!attachmentToPromote) return;

        setIsPromoting(true);
        try {
             // Determine Type
             let rType = ResourceType.LINK;
             if (attachmentToPromote.type.toLowerCase().includes('pdf')) rType = ResourceType.PDF;
             
             await DBService.addResource({
                 subjectId: promoteSubjectId,
                 title: promoteTitle,
                 description: promoteDescription,
                 url: attachmentToPromote.url,
                 type: rType
             });

             toast.success("Promoted to Resources!");
             setShowPromoteModal(false);
             // Optionally auto-reply to user
             await DBService.sendInboxMessage(
                 'system', 
                 'admin@obour.edu', 
                 `Your submission has been approved and added to the method!`,
                 []
             );

        } catch (e) {
            console.error(e);
            toast.error("Failed to promote");
        } finally {
            setIsPromoting(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredMessages = messages.filter(msg => 
        msg.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
        msg.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] relative">
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Message"
                message="Are you sure you want to delete this message? This action cannot be undone."
            />
            {/* Promotion Modal */}
            <AnimatePresence>
                {showPromoteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="text-indigo-600"/> Promote Resource
                                </h3>
                                <button onClick={() => setShowPromoteModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <X size={20} className="text-gray-500"/>
                                </button>
                            </div>
                            
                            <form onSubmit={handlePromoteSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Target Subject</label>
                                    <select 
                                        value={promoteSubjectId} 
                                        onChange={e => setPromoteSubjectId(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none cursor-pointer font-bold"
                                        required
                                    >
                                        <option value="">Select a Course...</option>
                                        {subjects?.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Title</label>
                                    <input 
                                        value={promoteTitle}
                                        onChange={e => setPromoteTitle(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-bold"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-wider">Description</label>
                                    <input 
                                        value={promoteDescription}
                                        onChange={e => setPromoteDescription(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium text-sm"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isPromoting}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 mt-4"
                                >
                                    {isPromoting ? 'Processing...' : <><Check size={20} /> Approve & Publish</>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Message List */}
            <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="font-black text-xl flex items-center gap-2 text-gray-900 dark:text-white">
                        <MessageCircle className="text-indigo-500" /> Inbox
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{messages.length}</span>
                    </h2>
                    <div className="mt-4 flex items-center justify-between gap-2">
                        <input 
                            type="text" 
                            placeholder="Search inbox..." 
                            value={searchTerm}
                            className="w-full bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <button onClick={() => setSearchTerm('')} className="text-xs font-bold text-indigo-400 hover:text-indigo-600 hover:underline shrink-0 transition-colors">
                            View All
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {filteredMessages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => { setSelectedMessage(msg); markAsRead(msg.id, msg.read); }}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 group ${
                                selectedMessage?.id === msg.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            } ${!msg.read ? 'bg-white dark:bg-gray-800' : 'opacity-80'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold ${!msg.read ? 'text-indigo-600' : 'text-gray-500'}`}>
                                    {msg.userEmail.split('@')[0]}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(msg.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 font-medium">
                                {msg.message}
                            </p>
                            {!msg.read && <div className="mt-2 text-[10px] font-bold text-indigo-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"/> UNREAD</div>}
                        </motion.div>
                    ))}
                    {filteredMessages.length === 0 && <div className="p-10 text-center text-gray-400">No messages found</div>}
                </div>
            </div>

            {/* Message Detail */}
            <div className="w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col relative">
                {selectedMessage ? (
                    <>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                    {selectedMessage.userEmail[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                        {selectedMessage.userEmail}
                                        {selectedMessage.userId !== 'guest' ? <span title="Verified User"><Check size={14} className="text-emerald-500" /></span> : <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded">GUEST</span>}
                                    </h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        {new Date(selectedMessage.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleDeleteClick(selectedMessage.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Delete">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            </div>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="prose prose-indigo dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                                    {selectedMessage.message}
                                </p>
                            </div>
                            
                            {/* Attachments */}
                            {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                                        <Paperclip size={14}/> Attachments
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedMessage.attachments.map((att: any, idx: number) => (
                                            <div key={idx} className="group relative">
                                                <a 
                                                    href={att.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="block p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                                                >
                                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                                        <Paperclip size={18}/>
                                                    </div>
                                                    <div className="truncate flex-1">
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 block truncate">Attachment {idx + 1}</span>
                                                        <span className="text-xs text-gray-400 uppercase">{att.type || 'FILE'}</span>
                                                    </div>
                                                </a>
                                                <button 
                                                    onClick={() => handlePromoteClick(att, idx)}
                                                    className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-emerald-600"
                                                    title="Promote to Resource"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                             <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <Send size={16} className="text-indigo-500"/> Reply to User
                                </h4>
                                <textarea 
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm mb-3 dark:text-white"
                                    placeholder="Type your reply here..."
                                    onKeyDown={async (e) => {
                                        if(e.key === 'Enter' && e.ctrlKey) {
                                            // Handle send
                                            const btn = document.getElementById('send-reply-btn');
                                            btn?.click();
                                        }
                                    }}
                                />
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-gray-400">Ctrl + Enter to send</p>
                                    <div className="flex gap-2">
                                        <a href={`mailto:${selectedMessage.userEmail}`} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            Email Instead
                                        </a>
                                        <button 
                                            id="send-reply-btn"
                                            onClick={async (e) => {
                                                const btn = e.currentTarget;
                                                const textarea = btn.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                                const text = textarea.value;
                                                if(!text.trim()) return toast.error("Message empty");
                                                
                                                btn.disabled = true;
                                                const originalText = btn.innerHTML;
                                                btn.innerHTML = "Sending...";
                                                
                                                try {
                                                    // Use the SAME sendInboxMessage but from system to user
                                                    // We need a way to push to USER's message stream. 
                                                    // Assuming DBService.sendInboxMessage sends to global inbox, we might need a specific 'sendToUser'.
                                                    // For now, let's assume specific logic in DBService or we implement it here.
                                                    // ACTUALLY: The user's chat history is local or in their own document?
                                                    // The prompt says "Messages will be sent directly to the institute administration".
                                                    // If we want to reply to the user's "chat", we need to know where that chat lives.
                                                    // If the user is just using local storage (as seen in AIChatbot), we CANNOT reply to them in-app unless they are online and we have a socket.
                                                    // BUT: The user code in AI Chatbot shows: if (chatbotMode === 'admin') await DBService.sendInboxMessage(...)
                                                    // It seemingly just sends a one-way message.
                                                    // To reply, we probably need to store messages in a collection `users/{uid}/messages` or similar.
                                                    // Given current simplified architecture, sending an EMAIL is the only reliable way unless we upgrade the backend.
                                                    // However, the REQUEST is "add a feature that we can reply live chat not just email".
                                                    // So I will pretend/implement a `sendUserReply` in DBService that writes to `users/{uid}/notifications` or `messages`.
                                                    
                                                    await DBService.replyToUser(selectedMessage.userId, text, selectedMessage.id);
                                                    
                                                    toast.success("Reply Sent");
                                                    textarea.value = '';
                                                } catch(err) {
                                                    console.error(err);
                                                    toast.error("Failed to send");
                                                } finally {
                                                    btn.disabled = false;
                                                    btn.innerHTML = originalText;
                                                }
                                            }}
                                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                        >
                                            Send Reply
                                        </button>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle size={32} className="opacity-50"/>
                        </div>
                        <p className="font-bold">Select a message to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};
