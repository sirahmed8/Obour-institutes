import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X, Lock } from 'lucide-react';
import { HelmetProvider } from 'react-helmet-async';
import { toast } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// Services
import { NotificationService } from './services/notification';
import { usePresence } from './hooks/usePresence';

// UI Components
import { ToastSetup } from './components/ui/ToastSetup';
import { Layout } from './components/layout/Layout';
import { AIChatbot } from './components/features/AIChatbot';
import { StudentProfileSetup } from './components/features/StudentProfileSetup';
import { CookieConsent } from './components/ui/CookieConsent';

// Lazy Pages
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const SubjectView = lazy(() => import('./pages/SubjectView').then(module => ({ default: module.SubjectView })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const NotificationsPage = lazy(() => import('./pages/Notifications').then(module => ({ default: module.NotificationsPage })));
const AIStudio = lazy(() => import('./pages/AIStudio').then(module => ({ default: module.AIStudio })));
const Team = lazy(() => import('./pages/Team').then(module => ({ default: module.Team })));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading Obour Institutes...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

const AppContent: React.FC = () => {
  usePresence(); 

  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const state = NotificationService.getPermissionState();
      // Only prompt automatically if default (unasked). Don't pester if denied.
      if (state === 'default') {
        // Show almost immediately (500ms delay for smooth mount)
        setTimeout(() => setShowNotifPrompt(true), 500);
      }
    };
    checkPermission();
  }, []);

  const handleEnableNotifications = async () => {
    // 1. Check if blocked
    if (Notification.permission === 'denied') {
        setShowNotifPrompt(false);
        toast((t) => (
            <div className="flex items-start gap-3">
               <Lock className="text-amber-500 shrink-0 mt-1" size={20} />
               <div>
                 <p className="font-bold">Notifications Blocked</p>
                 <p className="text-xs mt-1">We cannot enable them for you. Please click the <b>Lock Icon 🔒</b> in your address bar and set Notifications to <b>Allow</b>.</p>
                 <button onClick={() => toast.dismiss(t.id)} className="text-indigo-500 text-xs font-bold mt-2 hover:underline">Got it</button>
               </div>
            </div>
        ), { duration: 6000 });
        return;
    }

    // 2. Request
    try {
      // Optimistically hide immediately
      setShowNotifPrompt(false);
      
      const token = await NotificationService.requestPermission();
      if (token) {
          toast.success("Notifications Enabled!");
      } else if (Notification.permission === 'granted') {
          // Even if token fails (e.g. network), if permission is granted, we succeeded in user's eyes
          toast.success("Notifications Allowed");
      } else {
          // If they denied it effectively
          if ((Notification.permission as NotificationPermission) === 'denied') {
             // It's gone anyway
          } else {
             // If they closed the popup without choosing, maybe show again later? 
             // For now, let's respect the "close" and not show immediate again.
          }
      }
    } catch (error) {
       console.error("Notification Error:", error);
       // It is already hidden by the optimistic hide above
    }
  };

  return (
    <>
      <Layout>
        <ToastSetup /> 
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Navigate to="/main" replace />} />
            <Route path="/main" element={<Home />} />
            <Route path="/subject/:id" element={<SubjectView />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/team" element={<Team />} />
            
            {/* Protected Routes */}
            <Route path="/admin" element={
              <ProtectedAdminRoute><Admin /></ProtectedAdminRoute>
            } />
            <Route path="/ai-studio" element={
              <ProtectedAdminRoute><AIStudio /></ProtectedAdminRoute>
            } />
          </Routes>
        </Suspense>

        
        <AnimatePresence>
          {showNotifPrompt && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-24 left-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-indigo-100 dark:border-gray-700 flex items-center gap-4 max-w-sm">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-600 dark:text-indigo-400"><Bell size={24} /></div>
              <div className="flex-1">
                <p className="text-sm font-bold dark:text-white">Enable Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Get updates on new lectures.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleEnableNotifications} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">Enable</button>
                <button onClick={() => setShowNotifPrompt(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
      <AIChatbot />
      <StudentProfileSetup />
      <CookieConsent />
    </>
  );
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
