import React, { useState, useEffect } from 'react';
import { LayoutGrid, LogOut, Moon, Sun, Globe, ChevronDown, Menu, X, Shield, LogIn, Monitor, BellRing, BellOff, Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

import { useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentUser, isAdmin, login, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use new hook for cleaner code
  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // "Feature": Persist Email Subscription 
  const [emailSubscribed, setEmailSubscribed] = useState(() => localStorage.getItem('email_sub') === 'true');
  const toggleEmailSub = () => {
      const newState = !emailSubscribed;
      setEmailSubscribed(newState);
      localStorage.setItem('email_sub', String(newState));
  };

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold' 
      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium';
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 relative">
          
          {/* LEFT: Logo & Mobile Toggle */}
          <div className="flex items-center">
            <button 
                onClick={toggleMobileMenu} 
                className="mr-3 md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
            >
                <Menu size={24} />
            </button>
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/obour-logo.png" 
                alt="Obour" 
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block transition-colors duration-300">
                Obour Institutes
              </span>
            </Link>
          </div>
          
          {/* CENTER: Navigation (Desktop) */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 h-full">
            {currentUser && (
               <div className="flex gap-2">
                  <Link 
                    to="/" 
                    className={`flex items-center px-4 py-2 rounded-full text-sm transition-all duration-300 ${isActive('/')}`}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    {t('student_view')}
                  </Link>
                  
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className={`flex items-center px-4 py-2 rounded-full text-sm transition-all duration-300 ${isActive('/admin')}`}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Hub
                    </Link>
                  )}
               </div>
            )}
          </div>

          {/* RIGHT: User Controls / Login */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-full p-1 pl-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 bg-white dark:bg-gray-700 focus-ring"
                >
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200 hidden sm:block max-w-[100px] truncate">
                      {currentUser.displayName?.split(' ')[0]}
                  </span>
                  <img 
                    src={currentUser.photoURL || ''} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-600"
                  />
                  <ChevronDown size={14} className="text-gray-500 mr-1" />
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden ring-1 ring-black ring-opacity-5 z-50"
                    >
                       <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                          <p className="font-bold text-gray-900 dark:text-white">{currentUser.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                       </div>

                       <div className="p-2 space-y-1">
                          {/* Theme Toggle with Animation */}
                          <div className="px-3 py-2 flex items-center justify-between rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                              <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                                  <Sun className="h-4 w-4 mr-2" />
                                  {t('theme')}
                              </div>
                              <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 relative">
                                  {(['light', 'system', 'dark'] as const).map((tMode) => (
                                      <button
                                          key={tMode}
                                          onClick={() => setTheme(tMode)}
                                          className={`relative z-10 p-1.5 rounded-md transition-colors duration-200 ${theme === tMode ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400 hover:text-gray-600'}`}
                                      >
                                          {theme === tMode && (
                                              <motion.div
                                                  layoutId="desktop-theme-pill"
                                                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                              />
                                          )}
                                          <span className="relative z-10">
                                              {tMode === 'light' ? <Sun size={14}/> : tMode === 'dark' ? <Moon size={14}/> : <Monitor size={14}/>}
                                          </span>
                                      </button>
                                  ))}
                              </div>
                          </div>

                          {/* Notifications Toggle */}
                          <div className="px-3 py-2 flex items-center justify-between rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                              <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                                   {Notification.permission === 'granted' ? <BellRing className="h-4 w-4 mr-2 text-emerald-500" /> : <BellOff className="h-4 w-4 mr-2 text-gray-400" />}
                                   Notifications
                              </div>
                              <button
                                  onClick={async () => {
                                      if (Notification.permission === 'granted') {
                                           // We can't revoke, but we can perhaps simulate toggling off in app state? 
                                           // For now, let's just show a toast explaining they must block in browser.
                                           // OR if user meant the "Future" feature, I will toggle a local state only.
                                            alert("To disable notifications completely, please adjust your browser settings.");
                                      } else {
                                          const permission = await Notification.requestPermission();
                                          if(permission === 'granted') window.location.reload(); // Refresh to sync
                                      }
                                  }}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${Notification.permission === 'granted' ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                              >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${Notification.permission === 'granted' ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                          </div>

                          <div className="px-3 py-2 flex items-center justify-between rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                              <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
                                  <Globe className="h-4 w-4 mr-2" />
                                  {t('language')}
                              </div>
                              <button
                                  onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                                  className="text-xs font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 transition-colors duration-300 focus-ring"
                              >
                                  {language === 'en' ? 'English' : 'العربية'}
                              </button>
                          </div>
                          <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                          <button 
                              onClick={() => logout()}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center transition-colors font-medium duration-200 focus-ring"
                          >
                              <LogOut className="h-4 w-4 mr-2" />
                              {t('logout')}
                          </button>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => login()}
                className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all duration-300 focus-ring"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t('sign_in')}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>

    {/* Mobile Slide-Over Drawer */}
    <AnimatePresence>
        {isMobileMenuOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={toggleMobileMenu}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
                />
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white dark:bg-gray-800 shadow-2xl z-50 md:hidden flex flex-col"
                >
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <span className="font-bold text-lg dark:text-white">Menu</span>
                        <button onClick={toggleMobileMenu} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"><X size={20}/></button>
                    </div>
                    <div className="p-4 space-y-2 flex-1 overflow-y-auto">
                        <Link to="/" onClick={toggleMobileMenu} className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 font-medium transition-colors duration-200">
                            <LayoutGrid className="mr-3 text-indigo-600"/> {t('student_view')}
                        </Link>
                        {isAdmin && (
                            <Link to="/admin" onClick={toggleMobileMenu} className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 font-medium transition-colors duration-200">
                                <Shield className="mr-3 text-indigo-600"/> Admin Hub
                            </Link>
                        )}
                        <hr className="border-gray-100 dark:border-gray-700 my-2"/>
                        <div className="flex items-center justify-between p-3">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">Theme</span>
                             <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 transition-colors duration-300">
                                {(['light', 'system', 'dark'] as const).map((tMode) => (
                                    <button
                                        key={tMode}
                                        onClick={() => setTheme(tMode)}
                                        className={`relative z-10 p-2 rounded-md transition-colors duration-200 ${theme === tMode ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400'}`}
                                    >
                                        {theme === tMode && (
                                              <motion.div
                                                  layoutId="mobile-theme-pill"
                                                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                              />
                                          )}
                                        <span className="relative z-10">
                                          {tMode === 'light' ? <Sun size={16}/> : tMode === 'dark' ? <Moon size={16}/> : <Monitor size={16}/>}
                                        </span>
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
    </>
  );
};
