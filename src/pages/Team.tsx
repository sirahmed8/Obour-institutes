import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Award } from 'lucide-react';
import { DBService } from '../services/storage';
import { AdminProfile } from '../types';

export const Team: React.FC = () => {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await DBService.getAdmins();
        setAdmins(data || []);
      } catch (e) {
        console.error("Team fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 py-16 dark:text-white"
    >
        <div className="text-center mb-16">
            <h1 className="text-5xl font-black mb-6 tracking-tight">Board of Administrators</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-xl font-medium leading-relaxed">The elite team ensuring academic resources are accessible, organized, and secure for every student.</p>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] animate-pulse"/>)}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {admins.map((admin, idx) => (
                    <motion.div 
                        key={admin.email}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center gap-6 group transition-all"
                    >
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-2xl transform group-hover:rotate-6 transition-transform ${admin.role === 'super_admin' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                            {admin.email[0].toUpperCase()}
                        </div>
                        <div className="w-full">
                            <h3 className="font-black text-2xl text-gray-900 dark:text-white mb-2 truncate px-2">{admin.email.split('@')[0]}</h3>
                            <div className="flex flex-col items-center gap-3">
                                {admin.role === 'super_admin' ? (
                                    <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl flex items-center gap-2 border border-purple-200 dark:border-purple-800">
                                        <Award size={14}/> SYSTEM OWNER
                                    </span>
                                ) : (
                                    <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl flex items-center gap-2 border border-indigo-100 dark:border-indigo-800">
                                        <Shield size={14}/> CURRICULUM ADMIN
                                    </span>
                                )}
                                <p className="text-sm font-bold text-gray-400 mt-2 truncate max-w-full italic">{admin.email}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
    </motion.div>
  );
};
export default Team;