import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, AlertTriangle, Info, CheckCircle, BellOff } from 'lucide-react';
import { DBService } from '../../services/storage';

interface BannerData {
  text: string;
  type: 'info' | 'warning' | 'success' | 'announcement';
  show: boolean;
}

export const Banner: React.FC = () => {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isPermanentlyDismissed, setIsPermanentlyDismissed] = useState(false);

  useEffect(() => {
    // Check if permanently dismissed
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissed_banners') || '[]');
    
    DBService.getSettings().then(settings => {
      if (settings.showAnnouncement && settings.announcement) {
        const bannerId = btoa(settings.announcement).slice(0, 20); // Create ID from content
        
        if (dismissedBanners.includes(bannerId)) {
          setIsPermanentlyDismissed(true);
          return;
        }
        
        setBanner({
          text: settings.announcement,
          type: settings.bannerType || 'announcement',
          show: settings.showAnnouncement
        });
        setIsVisible(true);
      }
    }).catch(() => {});
  }, []);

  const handleDismissOnce = () => {
    setIsVisible(false);
    // Add to notification history
    if (banner) {
      const history = JSON.parse(localStorage.getItem('notification_history') || '[]');
      history.unshift({
        id: Date.now(),
        text: banner.text,
        type: banner.type,
        timestamp: new Date().toISOString(),
        read: true
      });
      // Keep only last 50 notifications
      localStorage.setItem('notification_history', JSON.stringify(history.slice(0, 50)));
    }
  };

  const handleDismissPermanently = () => {
    if (!banner) return;
    
    const bannerId = btoa(banner.text).slice(0, 20);
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissed_banners') || '[]');
    dismissedBanners.push(bannerId);
    localStorage.setItem('dismissed_banners', JSON.stringify(dismissedBanners));
    
    // Also add to history
    const history = JSON.parse(localStorage.getItem('notification_history') || '[]');
    history.unshift({
      id: Date.now(),
      text: banner.text,
      type: banner.type,
      timestamp: new Date().toISOString(),
      read: true,
      dismissed: true
    });
    localStorage.setItem('notification_history', JSON.stringify(history.slice(0, 50)));
    
    setIsPermanentlyDismissed(true);
    setIsVisible(false);
  };

  if (!banner || !banner.show || isPermanentlyDismissed) return null;

  const typeStyles = {
    info: {
      bg: 'bg-blue-500',
      icon: Info,
      gradient: 'from-blue-500 to-indigo-600'
    },
    warning: {
      bg: 'bg-amber-500',
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-600'
    },
    success: {
      bg: 'bg-emerald-500',
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-green-600'
    },
    announcement: {
      bg: 'bg-indigo-600',
      icon: Megaphone,
      gradient: 'from-indigo-600 to-purple-600'
    }
  };

  const style = typeStyles[banner.type];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] shadow-xl"
        >
          <div className={`bg-gradient-to-r ${style.gradient} text-white`}>
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shrink-0"
                  >
                    <Icon size={20} />
                  </motion.div>
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="font-bold text-sm sm:text-base leading-tight"
                  >
                    {banner.text}
                  </motion.p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {/* Dismiss forever button */}
                  <button
                    onClick={handleDismissPermanently}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-full transition-colors whitespace-nowrap"
                    title="Don't show again"
                  >
                    <BellOff size={14} />
                    <span className="hidden sm:inline">Don't show again</span>
                  </button>
                  
                  {/* Dismiss once button */}
                  <button
                    onClick={handleDismissOnce}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
