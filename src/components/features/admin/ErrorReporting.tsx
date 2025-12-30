import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle, Clock, Trash2, RefreshCw, XCircle } from 'lucide-react';
import { DBService } from '../../../services/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export const ErrorReporting: React.FC = () => {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    setLoading(true);
    const data = await DBService.getSystemErrors();
    setErrors(data);
    setLoading(false);
  };

  const handleResolve = async (id: string) => {
    try {
        await DBService.resolveError(id);
        setErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: true } : e));
        toast.success("Marked as resolved");
    } catch(e) { toast.error("Action failed"); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black flex items-center gap-3 dark:text-white">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <AlertOctagon size={24} />
            </div>
            System Health & Errors
        </h3>
        <button 
            onClick={fetchErrors}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
        >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {errors.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-600">
              <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4 opacity-50" />
              <p className="font-bold text-gray-500 dark:text-gray-400">System Healthy</p>
              <p className="text-xs text-gray-400 mt-1">No reported errors found.</p>
          </div>
      ) : (
          <div className="space-y-4">
              <AnimatePresence>
              {errors.map((err) => (
                  <motion.div 
                    key={err.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-5 rounded-2xl border ${
                        err.resolved 
                        ? 'bg-gray-50 border-gray-100 dark:bg-gray-700/20 dark:border-gray-700 opacity-60' 
                        : 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'
                    }`}
                  >
                      <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                  <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                                      err.resolved ? 'bg-gray-200 text-gray-500' : 'bg-red-200 text-red-700'
                                  }`}>
                                      {err.context || 'System'}
                                  </span>
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Clock size={12} /> {new Date(err.timestamp).toLocaleString()}
                                  </span>
                              </div>
                              <p className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all">{err.error}</p>
                          </div>
                          {!err.resolved && (
                              <button 
                                onClick={() => handleResolve(err.id)}
                                className="px-4 py-2 bg-white dark:bg-gray-800 text-sm font-bold shadow-sm rounded-xl text-emerald-600 border border-emerald-100 hover:bg-emerald-50 transition-colors"
                              >
                                  Resolve
                              </button>
                          )}
                      </div>
                  </motion.div>
              ))}
              </AnimatePresence>
          </div>
      )}
    </div>
  );
};
