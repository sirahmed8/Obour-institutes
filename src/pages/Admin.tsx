import React, { useState, useEffect, Suspense } from 'react';
import { BookOpen, Layers, Shield, Settings, Activity, Users, UserPlus, Trash2, RefreshCcw, Bell, AlertTriangle, AlertCircle } from 'lucide-react';
import { DBService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Subject, Log, SystemSettings, AdminProfile, UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Modular Components
import { SubjectManager } from '../components/features/admin/SubjectManager';
import { ResourceForm } from '../components/features/admin/ResourceForm';
import { SystemLogs } from '../components/features/admin/SystemLogs';
import { GlobalSettings } from '../components/features/GlobalSettings';

// Lazy Load Analytics
const AnalyticsDashboard = React.lazy(() => import('../components/features/admin/AnalyticsDashboard'));

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

export const Admin: React.FC = () => {
  const { currentUser, isAdmin, role, canEdit, canDelete } = useAuth();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [analyticsLogs, setAnalyticsLogs] = useState<Log[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({ announcement: '', showAnnouncement: false });
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  
  const [activeTab, setActiveTab] = useState('analytics');
  const [isResettingAnalytics, setIsResettingAnalytics] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<UserRole>('viewer');

  useEffect(() => {
    // Only fetch if we are legitimately an admin
    if (isAdmin) {
       refreshData();
    } else {
       // If not admin, we redirect anyway, so no op
       const t = setTimeout(() => {
          if (!isAdmin && !loadingData) navigate('/');
       }, 500);
       return () => clearTimeout(t);
    }
  }, [isAdmin, navigate]);

  const refreshData = async () => {
    setLoadingData(true);
    try {
        // Run requests in parallel but simpler catch blocks
        const subs = await DBService.getSubjects().catch(err => {
             console.error("Failed to fetch subjects:", err);
             return []; 
        });
        
        const anaLogs = await DBService.getAnalyticsLogs().catch(err => {
            console.warn("Analytics logs fetch restricted or failed:", err);
            return [];
        });

        const sysSettings = await DBService.getSettings().catch(() => ({ announcement: '', showAnnouncement: false }));
        
        // Only fetch admins if super_admin or we handle the error gracefully
        const adminList = await DBService.getAdmins().catch(() => []); // Might fail if not allowed
        
        setSubjects(subs || []); 
        setAnalyticsLogs(anaLogs || []);
        setSettings(sysSettings);
        setAdmins(adminList || []);
        toast.success("Dashboard Updated");
    } catch(e) { 
        console.error("Admin Critical Data Load Error:", e);
        toast.error("Some data failed to load. Check console.");
    } finally {
        setLoadingData(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canDelete) return toast.error("Permission Denied: Owner only");
      try {
          await DBService.addAdmin(newAdminEmail, newAdminRole);
          setNewAdminEmail('');
          refreshData();
          toast.success("Admin Added");
      } catch (e) { toast.error("Failed to add member"); }
  };

  const handleRemoveAdmin = async (email: string) => {
      if (!canDelete) return toast.error("Permission Denied");
      if (email === currentUser?.email) return toast.error("Cannot remove yourself");
      if (confirm(`Remove ${email}?`)) {
          await DBService.removeAdmin(email);
          refreshData();
          toast.success("Member Removed");
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-4 py-10 pb-24 dark:text-white min-h-screen"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Hub</h1>
          <p className="text-gray-500 mt-2 flex items-center gap-2 font-medium">
            Role: <span className="font-mono bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-md shadow-indigo-500/30">
                {role === 'super_admin' ? 'OWNER' : role?.replace('_', ' ').toUpperCase()}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={refreshData} 
                disabled={loadingData}
                className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-3 rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 transition-all active:scale-95 disabled:opacity-50"
            >
                <RefreshCcw size={20} className={loadingData ? "animate-spin" : ""} />
            </button>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl flex items-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 mr-3" /> 
              <span className="font-bold">Secure Access</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 space-y-2">
            {[ 
                {id: 'analytics', label: 'Analytics', icon: Activity},
                {id: 'resource', label: 'Add Resource', icon: Layers}, 
                {id: 'subject', label: 'Curriculum', icon: BookOpen}, 
                {id: 'team', label: 'Team & Roles', icon: Users},
                {id: 'logs', label: 'System Logs', icon: AlertTriangle},
                {id: 'settings', label: 'Global Settings', icon: Settings},
            ].map(t => (
                <motion.button 
                  key={t.id} 
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(t.id)} 
                  className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all font-bold text-left ${
                    activeTab === t.id 
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xl border border-indigo-50 dark:border-gray-700' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-indigo-600'
                  }`}
                >
                    <t.icon className={`mr-4 w-5 h-5 ${activeTab === t.id ? 'text-indigo-600' : 'text-gray-400'}`}/> 
                    {t.label}
                </motion.button>
            ))}
        </div>

        <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'analytics' && (
                  <Suspense fallback={<LoadingFallback />}>
                      <AnalyticsDashboard logs={analyticsLogs || []} subjects={subjects || []} />
                  </Suspense>
                )}

                {activeTab === 'resource' && (
                   canEdit ? <ResourceForm subjects={subjects || []} onSuccess={refreshData} /> : <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">Restricted Tab.</div>
                )}

                {activeTab === 'subject' && (
                  canEdit ? <SubjectManager subjects={subjects || []} onRefresh={refreshData} /> : <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">Restricted Tab.</div>
                )}
              
                {activeTab === 'team' && (
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <h3 className="text-xl font-bold mb-8 flex items-center dark:text-white"><Users className="mr-3 text-indigo-500" /> Manage Team</h3>
                      {canDelete && (
                          <form onSubmit={handleAddAdmin} className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                             <h4 className="font-bold mb-4 text-sm uppercase tracking-wide text-gray-500">Add New Member</h4>
                             <div className="flex flex-col sm:flex-row gap-4">
                                <input 
                                  type="email" 
                                  placeholder="Email Address" 
                                  value={newAdminEmail}
                                  onChange={e => setNewAdminEmail(e.target.value)}
                                  className="flex-1 p-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                  required
                                />
                                <select 
                                  value={newAdminRole}
                                  onChange={e => setNewAdminRole(e.target.value as UserRole)}
                                  className="p-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="viewer" className="dark:bg-gray-800">Viewer</option>
                                    <option value="editor" className="dark:bg-gray-800">Editor</option>
                                    <option value="super_admin" className="dark:bg-gray-800">Owner</option>
                                </select>
                                <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center">
                                    <UserPlus size={20} />
                                </button>
                             </div>
                          </form>
                      )}
                      <div className="space-y-3">
                          {admins.map(admin => (
                              <div key={admin.email} className="flex justify-between items-center p-4 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl hover:shadow-md transition-shadow">
                                  <div className="flex items-center gap-4">
                                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${admin.role === 'super_admin' ? 'bg-purple-500' : 'bg-indigo-500'}`}>
                                          {admin.email[0].toUpperCase()}
                                      </div>
                                      <div>
                                          <p className="font-bold dark:text-white">{admin.email}</p>
                                          <span className="text-xs uppercase tracking-widest text-indigo-500 font-black">{admin.role.replace('_', ' ')}</span>
                                      </div>
                                  </div>
                                  {canDelete && admin.email !== currentUser?.email && (
                                      <button onClick={() => handleRemoveAdmin(admin.email)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"><Trash2 size={18}/></button>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
                )}

                {activeTab === 'logs' && <SystemLogs canDelete={canDelete} />}
                {activeTab === 'settings' && <GlobalSettings canEdit={canEdit} />}
              </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};