import React, { useState, useEffect } from 'react';
import { Settings, Megaphone, Trash2, Save, Loader2, Key, AlertCircle, Link as LinkIcon, Database, BellOff, Bell, HelpCircle } from 'lucide-react';
import { DBService } from '../services/storage';
import { NotificationService } from '../services/notification';
import { SystemSettings } from '../types';
import { toast } from '../services/toaster';

export const GlobalSettings: React.FC<{ canEdit: boolean }> = ({ canEdit }) => {
  const [settings, setSettings] = useState<SystemSettings>({ 
    announcement: '', 
    showAnnouncement: false,
    apiBaseUrl: '' 
  });
  
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await DBService.getSettings();
    setSettings(data);
    
    if(data.apiBaseUrl) localStorage.setItem('api_base_url', data.apiBaseUrl);

    if (canEdit) {
        const key = await DBService.getSystemApiKey('gemini');
        if (key) setApiKey(key);
    }
  };

  const handleSaveSettings = async () => {
    if (!canEdit) return toast.error("Permission Denied");
    setLoading(true);
    try {
      await DBService.updateSettings(settings);

      if (settings.apiBaseUrl) {
        localStorage.setItem('api_base_url', settings.apiBaseUrl);
      } else {
        localStorage.removeItem('api_base_url');
      }

      if (apiKey) {
          await DBService.saveSystemApiKey('gemini', apiKey);
      }
      
      toast.success("Global configuration updated successfully");
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!canEdit) return toast.error("Permission Denied");
    
    setLoading(true);
    try {
      const newSettings = { ...settings, announcement: '', showAnnouncement: false };
      await DBService.updateSettings(newSettings);
      setSettings(newSettings);
      // Also clear local dismissal so new banners show up later
      localStorage.removeItem('banner_dismissed_forever');
      toast.success("Banner removed");
    } catch (e) {
      toast.error("Failed to delete banner");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionToggle = async () => {
      const current = Notification.permission;
      if (current === 'granted') {
          toast.info("You are already subscribed to updates.");
      } else {
          const token = await NotificationService.requestPermission();
          if (token) toast.success("Subscribed to News & Updates!");
          else toast.error("Permission Denied. Please enable in browser settings.");
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center">
          <Settings className="mr-3 text-indigo-500" /> Global Configuration
        </h3>
        
        <div className="space-y-8">
          
          {/* AI API Key */}
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
             <div className="flex items-center gap-2 mb-4">
                <Key size={18} className="text-indigo-600 dark:text-indigo-400"/>
                <h4 className="font-bold text-gray-900 dark:text-white">Gemini AI Configuration</h4>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">API Key</label>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="gemini_api_key_field"
                      autoComplete="off"
                      data-lpignore="true"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={!canEdit}
                      placeholder="Paste your AIzaSy... key here"
                      className="flex-1 p-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-mono tracking-wide"
                    />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                  <AlertCircle size={12} className="mr-1"/> 
                  Required for Cloud Mode. If empty, Chatbot uses Local Mode (Offline).
                </p>
             </div>
          </div>

          {/* Subscriptions & Notifications */}
           <div className="p-6 bg-gray-50 dark:bg-gray-700/20 rounded-2xl border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center">
                 <div>
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Bell size={16}/> News Subscription</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive alerts for new lectures and important announcements.</p>
                 </div>
                 <button onClick={handleSubscriptionToggle} className="text-sm font-bold text-indigo-600 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                     Subscribe
                 </button>
             </div>
          </div>

          {/* API Base URL */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700/20 rounded-2xl border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-2 mb-4">
                <Database size={18} className="text-gray-600 dark:text-gray-300"/>
                <h4 className="font-bold text-gray-900 dark:text-white">External API Connection</h4>
                <div className="group relative">
                    <HelpCircle size={14} className="text-gray-400 cursor-pointer"/>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs p-2 rounded-lg w-48 text-center hidden group-hover:block backdrop-blur-sm pointer-events-none">
                        Optional: Enter your backend URL if you are hosting a custom server. Leave empty to use default.
                    </div>
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">API Base URL</label>
                <div className="flex gap-2">
                    <input 
                      type="url"
                      value={settings.apiBaseUrl || ''}
                      onChange={(e) => setSettings({...settings, apiBaseUrl: e.target.value})}
                      disabled={!canEdit}
                      placeholder="https://api.your-backend.com/v1"
                      className="flex-1 p-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                    />
                </div>
             </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 my-6"></div>

          {/* Announcement Banner */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                 <Megaphone size={16} className="text-gray-400"/> Announcement Banner
               </label>
               {canEdit && settings.announcement && (
                 <button 
                   onClick={handleDeleteBanner}
                   className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center"
                 >
                   <Trash2 size={12} className="mr-1" /> Delete Banner
                 </button>
               )}
            </div>
            <textarea 
              value={settings.announcement} 
              onChange={(e) => setSettings({...settings, announcement: e.target.value})}
              disabled={!canEdit}
              placeholder="Write a message visible to all students on the Home Page..."
              className="w-full p-4 rounded-2xl border border-gray-200 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white min-h-[120px] focus:ring-2 focus:ring-indigo-500 transition-all resize-y shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3">
               <input 
                 type="checkbox" 
                 id="showBanner"
                 checked={settings.showAnnouncement}
                 onChange={(e) => setSettings({...settings, showAnnouncement: e.target.checked})}
                 disabled={!canEdit}
                 className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 cursor-pointer"
               />
               <label htmlFor="showBanner" className="cursor-pointer">
                  <span className="font-bold dark:text-white block">Enable Banner Display</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Toggle visibility without deleting the text.</span>
               </label>
             </div>
          </div>

          {canEdit && (
            <div className="pt-2 flex justify-end">
              <button 
                onClick={handleSaveSettings} 
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" size={18} />}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};