import React from 'react';
import { Navbar } from './Navbar';
import { Share2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dir } = useLanguage();

  return (
    <div 
      dir={dir} 
      className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ease-in-out w-full overflow-x-hidden relative"
    >
      {/* Background Texture for 'Alive' feel */}
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-5 mix-blend-multiply dark:mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>

      {/* Navbar Fixed at Top */}
      <div className="z-50 relative">
        <Navbar />
      </div>

      {/* Main Content Grows to fill space */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Pushed to Bottom */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto transition-colors duration-300 w-full z-10 relative">
        <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Obour Institutes &copy; {new Date().getFullYear()} | Developed by Ahmed Alaa
            </p>
            <a 
              href="https://linktr.ee/sir.ahmed" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all hover:scale-105"
            >
              Social Media 
              <Share2 size={14} className="group-hover:rotate-12 transition-transform"/>
            </a>
        </div>
      </footer>
    </div>
  );
};
