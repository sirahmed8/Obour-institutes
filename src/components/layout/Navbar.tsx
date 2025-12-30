import React, { useState, useEffect } from 'react';
import { LayoutGrid, LogOut, Moon, Sun, Globe, ChevronDown, Menu, X, Shield, LogIn, Monitor, BellRing, BellOff, Mail, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

import { useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Switch } from '../ui/Switch';
import { NotificationDropdown } from '../features/NotificationDropdown';
import { Tooltip } from '../ui/Tooltip';

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
            {/* Mobile: Direct Links (Icons) */}
            <div className="flex md:hidden items-center gap-1 mr-2">
                {currentUser && (
                    <>
                    <Link to="/main" className={`p-2 rounded-full ${isActive('/main')}`}>
                        <LayoutGrid size={20} />
                    </Link>
                    {isAdmin && (
                        <Link to="/admin" className={`p-2 rounded-full ${isActive('/admin')}`}>
                            <Shield size={20} />
                        </Link>
                    )}
                    </>
                )}
            </div>

            <Link to="/main" className="flex items-center gap-3 group">
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
                    to="/main" 
                    className={`flex items-center px-4 py-2 rounded-full text-sm transition-all duration-300 ${isActive('/main')}`}
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
          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser ? (
              <>
                 {/* Notification Bell (Desktop) */}
                 <div className="hidden sm:block relative group">
                    <NotificationDropdown />
                 </div>

                  <div className="relative" ref={dropdownRef}>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleDropdown} 
                      /* If open, clicking again closes it (toggle behavior) */
                      className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-full p-1 pl-1 sm:pl-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200 hidden sm:block max-w-[200px] truncate">
                          {currentUser.displayName}
                      </span>
                      <img 
                        src={currentUser.photoURL || ''} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-600 objec-cover"
                      />
                      <ChevronDown size={14} className={`text-gray-500 mr-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95, rotateX: -15 }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95, rotateX: -15 }}
                          transition={{ type: "spring", damping: 25, stiffness: 300 }}
                          className="absolute right-0 rtl:right-auto rtl:left-0 mt-4 w-72 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10 overflow-hidden ring-1 ring-black/5 z-50 origin-top-right rtl:origin-top-left text-left"
                        >
                           <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/40 dark:to-purple-900/40 z-0"/>
                              <div className="relative z-10 flex items-center gap-4">
                                <div className="relative shrink-0">
                                    <img 
                                      src={currentUser.photoURL || ''} 
                                      alt="Profile" 
                                      className="h-12 w-12 rounded-2xl object-cover shadow-lg border-2 border-white dark:border-gray-600"
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white text-base leading-tight break-words">
                                        {currentUser.displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono opacity-80 mt-0.5 truncate">
                                        {currentUser.email}
                                    </p>
                                </div>
                              </div>
                           </div>

                           <div className="p-2 space-y-1.5">
                              {/* Theme Selector Pilled */}
                              <div className="p-2 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl mb-2">
                                  <div className="grid grid-cols-3 gap-1">
                                      {(['light', 'system', 'dark'] as const).map((mode) => (
                                          <button
                                              key={mode}
                                              onClick={() => setTheme(mode)}
                                              className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-200 ${
                                                theme === mode 
                                                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold scale-105' 
                                                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                              }`}
                                          >
                                              {mode === 'light' ? <Sun size={18} className={theme===mode ? "fill-orange-400 text-orange-400":""}/> : 
                                               mode === 'dark' ? <Moon size={18} className={theme===mode ? "fill-indigo-400 text-indigo-400":""}/> : 
                                               <Monitor size={18} />}
                                              <span className="text-[10px] mt-1 capitalize font-medium">{mode}</span>
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <button 
                                onClick={() => {
                                  if (Notification.permission === 'granted') {
                                     toast("To disable notifications, please change your browser settings.", { icon: 'ℹ️' });
                                  } else {
                                     Notification.requestPermission();
                                  }
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                              >
                                   <div className="flex items-center gap-3">
                                       <div className={`p-2 rounded-lg transition-colors ${Notification.permission === 'granted' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                                           <BellRing size={16} />
                                       </div>
                                       <div className="text-left">
                                           <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Push Notifications</p>
                                           <p className="text-[10px] text-gray-400">{Notification.permission === 'granted' ? 'Active' : 'Tap to enable'}</p>
                                       </div>
                                   </div>
                                   <div className={`w-8 h-4 rounded-full relative transition-colors ${Notification.permission === 'granted' ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${Notification.permission === 'granted' ? 'left-4.5' : 'left-0.5'}`} style={{ left: Notification.permission === 'granted' ? 'calc(100% - 14px)' : '2px' }}/>
                                   </div>
                              </button>

                              <button 
                                onClick={toggleEmailSub}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                              >
                                   <div className="flex items-center gap-3">
                                       <div className={`p-2 rounded-lg transition-colors ${emailSubscribed ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                                           <Mail size={16} />
                                       </div>
                                       <div className="text-left">
                                           <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('email_updates')}</p>
                                           <p className="text-[10px] text-gray-400">Weekly digest</p>
                                       </div>
                                   </div>
                                   <div className={`w-8 h-4 rounded-full relative transition-colors ${emailSubscribed ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${emailSubscribed ? 'left-4.5' : 'left-0.5'}`} style={{ left: emailSubscribed ? 'calc(100% - 14px)' : '2px' }}/>
                                   </div>
                              </button>

                              <button 
                                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                              >
                                   <div className="flex items-center gap-3">
                                       <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                           <Globe size={16} />
                                       </div>
                                       <div className="text-left">
                                           <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('language')}</p>
                                           <p className="text-[10px] text-gray-400">{language === 'en' ? 'English' : 'العربية'}</p>
                                       </div>
                                   </div>
                                   <span className="text-xs font-black bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-600 dark:text-gray-300">
                                     {language.toUpperCase()}
                                   </span>
                              </button>

                              <div className="h-px bg-gray-100 dark:bg-gray-700/50 my-1 mx-2" />

                              <button 
                                  onClick={() => {
                                  setIsDropdownOpen(false);
                                  logout();
                                }}
                                className="w-full relative overflow-hidden p-3 rounded-xl flex items-center gap-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                              >
                                  <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 group-hover:bg-white dark:group-hover:bg-transparent transition-colors">
                                    <LogOut size={16} />
                                  </div>
                                  <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">{t('logout')}</span>
                              </button>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </>
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

    </>
  );
};
