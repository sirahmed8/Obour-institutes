import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { toastManager, ToastEvent } from '../services/toaster';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    return toastManager.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);
      // Auto dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    });
  }, []);

  const dismiss = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-md border border-opacity-50 min-w-[320px] max-w-[400px] ${
              t.type === 'success' 
                ? 'bg-white/95 text-green-900 border-green-200 dark:bg-gray-800/95 dark:text-green-400 dark:border-green-900'
                : t.type === 'error'
                ? 'bg-white/95 text-red-900 border-red-200 dark:bg-gray-800/95 dark:text-red-400 dark:border-red-900'
                : 'bg-white/95 text-blue-900 border-blue-200 dark:bg-gray-800/95 dark:text-blue-400 dark:border-blue-900'
            }`}
          >
            <div className="mt-0.5">
                {t.type === 'success' && <CheckCircle size={20} className="shrink-0 text-green-500" />}
                {t.type === 'error' && <AlertCircle size={20} className="shrink-0 text-red-500" />}
                {t.type === 'info' && <Info size={20} className="shrink-0 text-blue-500" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed">
                {t.message}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};