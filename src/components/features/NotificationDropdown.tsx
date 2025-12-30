import React, { useState, useEffect, useRef } from 'react';
import { BellRing, Check, Clock, Trash2, CheckCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useClickOutside } from '../../hooks/useClickOutside';
import { toast } from 'react-hot-toast';

export const NotificationDropdown: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useClickOutside(dropdownRef, () => setIsOpen(false));

    useEffect(() => {
        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(5));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(data);
            // Simple logic: if new data arrives, check if viewed logic exists or just use local count
            if (data.length > 0) setUnreadCount(prev => prev > 0 ? prev : 1); // Keep dot if already there or new data
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'notifications', id));
            toast.success("Notification removed");
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const handleMarkAllRead = () => {
        setUnreadCount(0);
        toast.success("All marked as read");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => { setIsOpen(!isOpen); setUnreadCount(0); }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            >
                <BellRing size={20} className={`text-gray-600 dark:text-gray-300 transition-colors ${isOpen ? 'text-indigo-600' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50 origin-top-right ring-1 ring-black ring-opacity-5"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                            <button 
                                onClick={handleMarkAllRead}
                                className="text-gray-400 hover:text-indigo-500 transition-colors p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                title="Mark all as read"
                            >
                                <CheckCheck size={18} />
                            </button>
                        </div>
                        
                        {/* List */}
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm italic">No notifications</div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n.id}
                                        onClick={() => { navigate(n.link); setIsOpen(false); }}
                                        className="p-4 border-b border-gray-50 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group relative"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                                n.type === 'file' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 
                                                n.type === 'announcement' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' : 
                                                'bg-gray-100 text-gray-500 dark:bg-gray-700'
                                            }`}>
                                                {n.type || 'Alert'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <Clock size={10}/>
                                                    {new Date(n.createdAt).toLocaleDateString()}
                                                </span>
                                                <button 
                                                    onClick={(e) => handleDelete(e, n.id)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1 pr-6">{n.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-2 bg-gray-50/80 dark:bg-slate-900/80 border-t border-gray-100 dark:border-white/10">
                            <Link 
                                to="/notifications" 
                                onClick={() => setIsOpen(false)} 
                                className="block w-full text-center py-3 text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors uppercase tracking-wider"
                            >
                                View All History
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
