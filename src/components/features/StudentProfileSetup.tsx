
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-hot-toast';
import { Shield, User, Hash, Check, Loader2 } from 'lucide-react';
import { UserData as UserType } from '../../types';

export const StudentProfileSetup: React.FC = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    
    useEffect(() => {
        if (!currentUser) return;

        const checkProfile = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    // If no student code or name is "Student" (default), show modal
                    if (!userData.studentCode || !userData.displayName || userData.displayName === 'Student') {
                        setIsOpen(true);
                        if (userData.displayName && userData.displayName !== 'Student') {
                             setName(userData.displayName);
                        } else if (currentUser.displayName) {
                             setName(currentUser.displayName);
                        }
                    }
                } else {
                    // New user doc
                    setIsOpen(true);
                    if (currentUser.displayName) setName(currentUser.displayName);
                }
            } catch (e) {
                console.error("Profile check failed", e);
            }
        };

        checkProfile();
    }, [currentUser]);

    const validateName = (val: string) => /^[a-zA-Z\s\u0600-\u06FF]+$/.test(val); // Letters and spaces (Ar/En)
    const validateCode = (val: string) => /^\d{6}$/.test(val); // Exactly 6 digits

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateName(name)) {
            toast.error("Name must contain letters only.");
            return;
        }
        if (!validateCode(code)) {
            toast.error("Student Code must be exactly 6 digits.");
            return;
        }

        setLoading(true);
        try {
            if (!currentUser) return;

            const userRef = doc(db, 'users', currentUser.uid);
            
            await setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: name,
                photoURL: currentUser.photoURL,
                studentCode: code,
                role: 'student', // Default
                updatedAt: new Date().toISOString()
            }, { merge: true });

            toast.success("Profile Setup Complete!");
            setIsOpen(false);
            
            // Optional: Reload page to sync context if needed, but context usually effectively updates on next fetch
            // window.location.reload(); 
        } catch (error) {
            console.error(error);
            toast.error("Failed to save profile.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[10005] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800"
                >
                    <div className="bg-indigo-600 p-8 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <Shield className="text-white" size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-white">Profile Setup</h2>
                        <p className="text-indigo-100 mt-2 text-sm font-medium">Please complete your registration to access Obour Institutes.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-gray-400 tracking-wider ml-1">Full Name (Letters Only)</label>
                             <div className="relative">
                                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                 <input 
                                     type="text" 
                                     value={name}
                                     onChange={(e) => setName(e.target.value)}
                                     className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl font-bold text-gray-900 dark:text-white outline-none transition-all"
                                     placeholder="e.g. Ahmed Alaa"
                                     required
                                 />
                             </div>
                        </div>

                        {/* Code Input */}
                        <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-gray-400 tracking-wider ml-1">Student Code (6 Digits)</label>
                             <div className="relative">
                                 <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                 <input 
                                     type="text" 
                                     value={code}
                                     onChange={(e) => {
                                         const val = e.target.value.replace(/\D/g, '');
                                         if (val.length <= 6) setCode(val);
                                     }}
                                     className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl font-bold text-gray-900 dark:text-white outline-none transition-all tracking-widest font-mono"
                                     placeholder="123456"
                                     required
                                 />
                                 {code.length === 6 && (
                                     <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                         <Check size={20} strokeWidth={3} />
                                     </div>
                                 )}
                             </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading || code.length !== 6 || name.length < 3}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Complete Setup"}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
