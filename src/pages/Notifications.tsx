
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, FileText, Megaphone, Calendar, ArrowRight, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DBService } from '../services/storage';
import { query, collection, orderBy, getDocs, limit, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import { toast } from 'react-hot-toast';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
    } catch(e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleNotificationClick = (n: any) => {
      navigate(n.link);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
          await deleteDoc(doc(db, 'notifications', id));
          setNotifications(prev => prev.filter(n => n.id !== id));
          toast.success("Deleted");
      } catch (e) {
          toast.error("Failed to delete");
      }
  };

  const handleClearAll = async () => {
      if (!window.confirm("Clear all notifications?")) return;
      try {
          const batch = writeBatch(db);
          notifications.forEach(n => {
              batch.delete(doc(db, 'notifications', n.id));
          });
          await batch.commit();
          setNotifications([]);
          toast.success("All cleared");
      } catch (e) {
          toast.error("Failed to clear");
      }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 dark:text-white min-h-screen">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
                    <Bell size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Inbox</h1>
                    <p className="text-gray-500 dark:text-gray-400">Updates & Resources</p>
                </div>
            </div>
            {notifications.length > 0 && (
                <button onClick={handleClearAll} className="text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors">
                    Clear All
                </button>
            )}
        </div>

        {loading ? (
            <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"/>)}
            </div>
        ) : notifications.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <CheckCircle size={40} className="mx-auto text-green-500 mb-4"/>
                <p className="text-gray-500 font-medium">You're all caught up!</p>
            </div>
        ) : (
            <div className="space-y-4">
                <AnimatePresence mode='popLayout'>
                {notifications.map((n, i) => (
                    <motion.div 
                        key={n.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleNotificationClick(n)}
                        className="group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all cursor-pointer flex items-center gap-5 relative"
                    >
                        <div className={`p-4 rounded-xl shrink-0 ${n.type === 'file' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'}`}>
                            {n.type === 'file' ? <FileText size={24}/> : <Megaphone size={24}/>}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">{n.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>{n.subjectName}</span>
                                <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={(e) => handleDelete(e, n.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all">
                                <Trash2 size={18}/>
                            </button>
                            <ArrowRight size={20} className="text-gray-300 group-hover:text-indigo-500"/>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
        )}
    </div>
  );
};
export default NotificationsPage;
