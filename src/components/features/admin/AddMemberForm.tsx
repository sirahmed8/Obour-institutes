import React, { useState } from 'react';
import { User, Shield, UserPlus, AlertCircle, Bell, Layers, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { DBService } from '../../../services/storage';
import { CustomSelect } from '../../ui/CustomSelect';
import { Switch } from '../../ui/Switch';
import { UserRole } from '../../../types';

interface AddMemberFormProps {
    onSuccess: () => void;
}

export const AddMemberForm: React.FC<AddMemberFormProps> = ({ onSuccess }) => {
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminRole, setNewAdminRole] = useState<UserRole>('viewer');
    const [newPermissions, setNewPermissions] = useState<any>({
        canCreateBanner: false,
        canSendEmails: false,
        canSendNotifications: false,
        canUploadResources: false,
        canEditSubjects: false
    });
    const [loading, setLoading] = useState(false);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const perms = newAdminRole === 'admin' ? newPermissions : undefined;
            await DBService.addAdmin(newAdminEmail, newAdminRole, perms);
            setNewAdminEmail('');
            setNewPermissions({
                canCreateBanner: false,
                canSendEmails: false,
                canSendNotifications: false,
                canUploadResources: false,
                canEditSubjects: false
            });
            toast.success("Member Added");
            onSuccess();
        } catch (e) { 
            toast.error("Failed to add member"); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all">
            <form onSubmit={handleAddAdmin} className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wide text-gray-500 flex items-center gap-2">
                    <UserPlus size={16}/> Add New Member
                </h4>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 w-full">
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={newAdminEmail}
                            onChange={e => setNewAdminEmail(e.target.value)}
                            className="w-full p-3.5 rounded-2xl border border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                            required
                        />
                    </div>
                    <div className="w-full md:w-64 relative z-20">
                        <CustomSelect 
                            value={newAdminRole}
                            onChange={(v) => setNewAdminRole(v as UserRole)}
                            options={[
                                { value: 'viewer', label: 'Member', icon: <User size={16}/> },
                                { value: 'admin', label: 'Admin', icon: <Shield size={16}/> }
                            ]}
                            placeholder="Select Role"
                        />
                    </div>
                    <button 
                        disabled={loading} 
                        className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3.5 rounded-2xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                        {loading ? 'Adding...' : 'Add Member'}
                    </button>
                </div>

                {/* Permissions Toggles */}
                <AnimatePresence>
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pt-2"
                    >
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-full flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {newAdminRole === 'admin' ? 'Admin Capabilities' : 'Member Capabilities'}
                                </p>
                                {newAdminRole === 'viewer' && (
                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-1 rounded-md">
                                        Granting permissions makes this member a limited admin.
                                    </span>
                                )}
                            </div>
                            
                            {[
                                { key: 'canCreateBanner', label: 'Create Banners', icon: AlertCircle },
                                { key: 'canSendEmails', label: 'Send Emails', icon: Users },
                                { key: 'canSendNotifications', label: 'Push Notifications', icon: Bell },
                                { key: 'canUploadResources', label: 'Upload Resources', icon: Layers },
                                { key: 'canEditSubjects', label: 'Edit Subjects', icon: BookOpen },
                            ].map((perm) => (
                                <div key={perm.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 transition-all gap-4">
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                        <div className={`p-2 rounded-lg ${
                                            (newPermissions as any)[perm.key] 
                                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 api-active' 
                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                            <perm.icon size={16} />
                                        </div>
                                        {perm.label}
                                    </div>
                                    <Switch 
                                        checked={(newPermissions as any)[perm.key]}
                                        onChange={(checked) => setNewPermissions({...newPermissions, [perm.key]: checked})}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </form>
        </div>
    );
};
