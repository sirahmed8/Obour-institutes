import React, { useState, useEffect, Suspense } from 'react';
import { BookOpen, Layers, Shield, Settings, Activity, Users, User, UserPlus, Trash2, RefreshCcw, Bell, AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';
import { DBService } from '../services/storage';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Subject, Log, SystemSettings, AdminProfile, UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { LoadingFallback } from '../components/ui/LoadingFallback';
import { CustomSelect } from '../components/ui/CustomSelect'; 
import { Switch } from '../components/ui/Switch';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

// Modular Components
import { SubjectManager } from '../components/features/admin/SubjectManager';
import { ResourceForm } from '../components/features/admin/ResourceForm';
import { SystemLogs } from '../components/features/admin/SystemLogs';
import { GlobalSettings } from '../components/features/GlobalSettings';
import { ErrorReporting } from '../components/features/admin/ErrorReporting';
import { Inbox } from '../components/features/admin/Inbox';
import { AddMemberForm } from '../components/features/admin/AddMemberForm';
import { MessageCircle } from 'lucide-react';


// Lazy Load Analytics
const AnalyticsDashboard = React.lazy(() => import('../components/features/admin/AnalyticsDashboard'));



export const Admin: React.FC = () => {
  const { currentUser, isAdmin, role, canEdit, canDelete } = useAuth();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [analyticsLogs, setAnalyticsLogs] = useState<Log[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({ announcement: '', showAnnouncement: false });
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  
  const [activeTab, setActiveTab] = useState('analytics');
  const [loadingData, setLoadingData] = useState(true);
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, email: string | null}>({isOpen: false, email: null});

  useEffect(() => {
    // Only fetch if we are legitimately an admin
    if (isAdmin) {
       refreshData(true); // Silent refresh on mount
    } else {
       // If not admin, we redirect anyway, so no op
       const t = setTimeout(() => {
          if (!isAdmin && !loadingData) navigate('/');
       }, 500);
       return () => clearTimeout(t);
    }
  }, [isAdmin, navigate]);

  const refreshData = async (silent = false) => {
    setLoadingData(true);
    try {
        // Parallel fetch for speed
        const [subs, anaLogs, sysSettings, adminList] = await Promise.all([
            DBService.getSubjects().catch(() => []),
            DBService.getAnalyticsLogs().catch(() => []),
            DBService.getSettings().catch(() => ({ announcement: '', showAnnouncement: false })),
            DBService.getAdmins().catch(() => [])
        ]);
        
        // Sorting is now enforced by the API (orderBy name asc)
        
        setSubjects(subs || []); 
        setAnalyticsLogs(anaLogs || []);
        setSettings(sysSettings as any);
        setAdmins(adminList || []);
        if (!silent) toast.success("Dashboard Updated");
    } catch(e) { 
        console.error("Admin Critical Data Load Error:", e);
        toast.error("Partial data load failure");
    } finally {
        setLoadingData(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
      if (!canDelete) return toast.error("Permission Denied");
      if (email === currentUser?.email) return toast.error("Cannot remove yourself");
      setConfirmModal({ isOpen: true, email });
  };
  
  const proceedRemoveAdmin = async () => {
      if (!confirmModal.email) return;
      await DBService.removeAdmin(confirmModal.email);
      refreshData();
      toast.success("Member Removed");
      setConfirmModal({ isOpen: false, email: null });
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
                onClick={() => refreshData(false)} 
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
                {id: 'inbox', label: 'Inbox', icon: MessageCircle}, // NEW INBOX TAB
                {id: 'resource', label: 'Add Resource', icon: Layers}, 
                {id: 'subject', label: 'Curriculum', icon: BookOpen}, 
                {id: 'team', label: 'Team & Roles', icon: Users},
                {id: 'errors', label: 'Error Reports', icon: AlertOctagon}, // NEW TAB
                {id: 'logs', label: 'System Logs', icon: AlertTriangle},
                {id: 'settings', label: 'Global Settings', icon: Settings},
            ].map(t => (
                <motion.button 
                  key={t.id} 
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(t.id)} 
                  className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all font-bold text-left focus:outline-none ${
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

                {activeTab === 'inbox' && <Inbox subjects={subjects || []} />}

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
                          <AddMemberForm onSuccess={refreshData} />
                      )}
                      <div className="space-y-3">
                          {admins.map(admin => (
                              <div key={admin.email} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-[1.5rem] hover:shadow-lg hover:border-indigo-100 dark:hover:border-gray-500 transition-all gap-6 group">
                                  <div className="flex items-center gap-5">
                                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-110 transition-transform ${
                                          admin.role === 'super_admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 
                                          admin.role === 'admin' ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : 'bg-gray-400'
                                      }`}>
                                          {admin.email[0].toUpperCase()}
                                      </div>
                                      <div>
                                          <p className="font-bold dark:text-white text-lg flex items-center gap-2">
                                            {admin.email.split('@')[0]}
                                            {admin.email === currentUser?.email && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono tracking-wide">{admin.email}</p>
                                          <div className="flex gap-2 mt-2">
                                            <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-lg ${
                                                admin.role === 'super_admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 
                                                admin.role === 'admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-300'
                                            }`}>
                                                {admin.role === 'super_admin' ? 'Owner' : admin.role === 'admin' ? 'Admin' : 'Member'}
                                            </span>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 self-end sm:self-auto">
                                      {/* Show permissions summary for admins */}
                                      {admin.role === 'admin' && admin.permissions && (
                                          <div className="hidden md:flex gap-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-600">
                                              {admin.permissions.canCreateBanner && <div title="Banners" className="p-1.5 bg-indigo-50 text-indigo-500 rounded-md"><AlertCircle size={14}/></div>}
                                              {admin.permissions.canSendEmails && <div title="Emails" className="p-1.5 bg-blue-50 text-blue-500 rounded-md"><Users size={14}/></div>}
                                              {admin.permissions.canUploadResources && <div title="Uploads" className="p-1.5 bg-emerald-50 text-emerald-500 rounded-md"><Layers size={14}/></div>}
                                          </div>
                                      )}
                                      
                                      {canDelete && admin.email !== currentUser?.email && (
                                          <button 
                                            onClick={() => handleRemoveAdmin(admin.email)} 
                                            className="text-gray-400 hover:text-red-500 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all group/delete"
                                            title="Remove Member"
                                          >
                                              <Trash2 size={20} className="group-hover/delete:scale-110 transition-transform"/>
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                )}

                {activeTab === 'errors' && <ErrorReporting />}
                {activeTab === 'logs' && <SystemLogs canDelete={canDelete} />}
                {activeTab === 'settings' && <GlobalSettings />}
              </motion.div>
            </AnimatePresence>
        </div>
      </div>
      
      <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({isOpen: false, email: null})}
          onConfirm={proceedRemoveAdmin}
          title="Remove Member?"
          message={`Are you sure you want to remove ${confirmModal.email} from the team? This action cannot be undone.`}
          isDeleting={loadingData}
      />
    </motion.div>
  );
};