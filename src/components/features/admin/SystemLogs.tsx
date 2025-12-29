
import React, { useEffect, useState } from 'react';
import { Trash2, RefreshCcw, FileText, User, Settings, Shield, Clock } from 'lucide-react';
import { DBService } from '../../../services/storage';
import { Log } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ConfirmationModal } from '../../ui/ConfirmationModal';

export const SystemLogs: React.FC<{ canDelete: boolean }> = ({ canDelete }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await DBService.getSystemLogs(100);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleClearLogs = async () => {
      try {
        await DBService.clearSystemLogs();
        setIsClearModalOpen(false);
        fetchLogs();
        toast.success("Logs Cleared");
      } catch (error) {
        console.error("Clear logs failed:", error);
        toast.error("Failed to clear logs");
      }
  };

  const getIcon = (action: string) => {
      if(action.includes('LOGIN')) return <User size={16} className="text-green-500"/>;
      if(action.includes('DELETE')) return <Trash2 size={16} className="text-red-500"/>;
      if(action.includes('SETTINGS')) return <Settings size={16} className="text-orange-500"/>;
      if(action.includes('ADMIN')) return <Shield size={16} className="text-purple-500"/>;
      return <FileText size={16} className="text-blue-500"/>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <ConfirmationModal 
            isOpen={isClearModalOpen}
            onClose={() => setIsClearModalOpen(false)}
            onConfirm={handleClearLogs}
            title="Clear System Logs"
            message="Are you sure you want to delete all system activity logs? This action cannot be undone."
            isDeleting={true}
        />

        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div>
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2"><Clock className="text-indigo-500"/> System Activity</h3>
                <p className="text-sm text-gray-500">Latest 100 actions performed on the platform.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={fetchLogs} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-colors"><RefreshCcw size={18}/></button>
                {canDelete && <button onClick={() => setIsClearModalOpen(true)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors">Clear Logs</button>}
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : (
                <div className="max-h-[600px] overflow-y-auto">
                    {logs.map((log, i) => (
                        <div key={log.id || i} className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                                {getIcon(log.action)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{log.action}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{log.details} • <span className="text-indigo-500">{log.userEmail}</span></p>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="p-8 text-center text-gray-400">No logs found.</div>}
                </div>
            )}
        </div>
    </div>
  );
};
