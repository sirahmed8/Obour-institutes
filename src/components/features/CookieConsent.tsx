import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Delay slightly for better UX
            const t = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(t);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setIsVisible(false);
        // Here you would initialize real analytics
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-20 md:bottom-0 left-0 right-0 p-4 z-50 flex justify-center pointer-events-none"
                    >
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 rounded-3xl max-w-2xl w-full pointer-events-auto flex flex-col md:flex-row gap-6 items-center">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl shrink-0">
                            <Cookie size={32} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">We use cookies</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                We use cookies and local storage to enhance your experience, save your preferences (like Dark Mode), and understand how you use our platform.
                            </p>
                        </div>
                        <div className="flex gap-3 shrink-0 w-full md:w-auto">
                            <button 
                                onClick={handleDecline}
                                className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Decline
                            </button>
                            <button 
                                onClick={handleAccept}
                                className="flex-1 md:flex-none px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                                Accept All
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
