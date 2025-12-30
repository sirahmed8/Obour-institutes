
import React, { useState, useEffect } from 'react';
import { Megaphone, Trash2, Save, Loader2, Mail, Send, CheckCircle, Bot, Wifi, WifiOff, Bell } from 'lucide-react';
import { DBService } from '../../services/storage';
import { SystemSettings } from '../../types';
import { toast } from 'react-hot-toast';
import { Switch } from '../ui/Switch';
import { useAuth } from '../../context/AuthContext';

export const GlobalSettings: React.FC = () => {
  const { permissions, role } = useAuth();
  const canManageBanner = role === 'super_admin' || permissions.canCreateBanner;
  const canSendEmails = role === 'super_admin' || permissions.canSendEmails;
  const canSendNotifs = role === 'super_admin' || permissions.canSendNotifications;
  
  const [settings, setSettings] = useState<SystemSettings>({ 
    announcement: '', 
    showAnnouncement: false,
    bannerType: 'announcement'
  });
  
  // Email & Notification State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifStatus, setNotifStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await DBService.getSettings();
    setSettings(data);
  };

  const handleSaveSettings = async () => {
    if (!canManageBanner) return toast.error("Permission Denied");
    setLoading(true);
    try {
      await DBService.updateSettings(settings, true);
      toast.success("Announcement updated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!canManageBanner) return toast.error("Permission Denied");
    
    setLoading(true);
    try {
      const newSettings = { ...settings, announcement: '', showAnnouncement: false };
      await DBService.updateSettings(newSettings);
      setSettings(newSettings);
      localStorage.removeItem('banner_dismissed_forever');
      toast.success("Banner removed");
    } catch (e) {
      toast.error("Failed to delete banner");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSendEmails) return toast.error("Permission Denied");
      if (!emailSubject || !emailBody) return toast.error("Please fill all email fields");

      setEmailStatus('sending');
      try {
          await DBService.sendEmail(emailSubject, emailBody);
          toast.success("Email queued for delivery");
          setEmailStatus('sent');
          setTimeout(() => {
              setEmailSubject('');
              setEmailBody('');
              setEmailStatus('idle');
          }, 2000);
      } catch (e) {
          toast.error("Failed to send email");
          setEmailStatus('idle');
      }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSendNotifs) return toast.error("Permission Denied");
      if (!notifTitle || !notifBody) return toast.error("Please fill all notification fields");

      setNotifStatus('sending');
      try {
          await DBService.sendNotification(notifTitle, notifBody);
          toast.success("Notification sent to all users");
          setNotifStatus('sent');
          setTimeout(() => {
              setNotifTitle('');
              setNotifBody('');
              setNotifStatus('idle');
          }, 2000);
      } catch (e) {
          toast.error("Failed to send notification");
          setNotifStatus('idle');
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- BANNER SECTION --- */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center">
          <Megaphone className="mr-3 text-indigo-500" /> Announcement Banner
        </h3>
        
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-3">
               <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                 Banner Message
               </label>
               {canManageBanner && settings.announcement && (
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
              disabled={!canManageBanner}
              placeholder="Write a message visible to all students on the Home Page..."
              className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white min-h-[120px] focus:ring-2 focus:ring-indigo-500 transition-all resize-y shadow-inner"
            />
          </div>

          {/* Banner Type Selection */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
             <div className="flex flex-col mb-4">
               <span className="font-bold dark:text-white">Banner Style</span>
               <span className="text-xs text-gray-500 dark:text-gray-400">Choose the color and urgency level.</span>
             </div>
             
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                 {[
                    { id: 'announcement', label: 'Announcement', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Megaphone },
                    { id: 'info', label: 'Info', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: CheckCircle }, // Using CheckCircle generically or Info icon
                    { id: 'warning', label: 'Warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Bell }, 
                    { id: 'success', label: 'Success', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle }
                 ].map((type) => (
                     <button
                        key={type.id}
                        onClick={() => setSettings({...settings, bannerType: type.id as any})}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            settings.bannerType === type.id
                            ? `border-indigo-500 bg-white dark:bg-gray-800 shadow-md transform scale-[1.02]`
                            : 'border-transparent hover:bg-white dark:hover:bg-gray-800 border-gray-100 dark:border-gray-600'
                        }`}
                     >
                        <div className={`p-2 rounded-lg ${type.color}`}>
                            <type.icon size={16} />
                        </div>
                        <span className={`text-sm font-bold ${settings.bannerType === type.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {type.label}
                        </span>
                     </button>
                 ))}
             </div>
          </div>

          {/* Banner Toggle */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
             <div className="flex flex-col">
               <span className="font-bold dark:text-white">Enable Banner Display</span>
               <span className="text-xs text-gray-500 dark:text-gray-400">Toggle visibility without deleting the text.</span>
             </div>
             <Switch 
                checked={settings.showAnnouncement} 
                onChange={(v) => setSettings({...settings, showAnnouncement: v})} 
                disabled={!canManageBanner}
             />
          </div>

          {canManageBanner && (
            <div className="pt-2 flex justify-end">
              <button 
                onClick={handleSaveSettings} 
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center hover-scale"
              >
                {loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" size={18} />}
                Publish Announcement
              </button>
            </div>
          )}
        </div>
      </div>



      {/* --- PUSH NOTIFICATION SECTION --- */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center">
            <Bell className="mr-3 text-rose-500" /> Push Notifications
          </h3>
          <form onSubmit={handleSendNotification} className="space-y-6">
              <div>
                  <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide block mb-2">Notification Title</label>
                  <input 
                      value={notifTitle}
                      onChange={e => setNotifTitle(e.target.value)}
                      placeholder="e.g. System Maintenance"
                      className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-rose-500 transition-all"
                      disabled={!canSendNotifs}
                  />
              </div>
              
              <div>
                  <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide block mb-2">Message</label>
                  <textarea 
                      value={notifBody}
                      onChange={e => setNotifBody(e.target.value)}
                      placeholder="e.g. The system will be down for 30 mins..."
                      className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white min-h-[100px] focus:ring-2 focus:ring-rose-500 transition-all"
                      disabled={!canSendNotifs}
                  />
              </div>

              {canSendNotifs && (
                  <div className="flex justify-end">
                      <button 
                          type="submit"
                          disabled={notifStatus === 'sending' || notifStatus === 'sent'}
                          className={`mt-4 px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center hover-scale text-white
                              ${notifStatus === 'sent' 
                                  ? 'bg-green-500 shadow-green-500/30' 
                                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30'
                              }
                          `}
                      >
                          {notifStatus === 'sending' && <Loader2 className="animate-spin mr-2"/>}
                          {notifStatus === 'sent' && <CheckCircle className="mr-2"/>}
                          {notifStatus === 'idle' && <Megaphone className="mr-2" size={18} />}
                          
                          {notifStatus === 'sending' ? 'Sending...' : notifStatus === 'sent' ? 'Sent!' : 'Send Notification'}
                      </button>
                  </div>
              )}
          </form>
      </div>

      {/* --- EMAIL SECTION --- */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center">
            <Mail className="mr-3 text-emerald-500" /> Email Broadcast
          </h3>
          
          <form onSubmit={handleSendEmail} className="space-y-6">
              <div>
                  <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide block mb-2">Subject</label>
                  <input 
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="e.g. Midterm Schedule Update"
                      className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                      disabled={!canSendEmails}
                  />
              </div>
              
              <div>
                  <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide block mb-2">Message Body (HTML Supported)</label>
                  <textarea 
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      placeholder="Dear students..."
                      className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white min-h-[150px] focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm"
                      disabled={!canSendEmails}
                  />
              </div>

              {canSendEmails && (
                  <div className="flex justify-end">
                      <button 
                          type="submit"
                          disabled={emailStatus === 'sending' || emailStatus === 'sent'}
                          className={`mt-4 px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center hover-scale text-white
                              ${emailStatus === 'sent' 
                                  ? 'bg-green-500 shadow-green-500/30' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                              }
                          `}
                      >
                          {emailStatus === 'sending' && <Loader2 className="animate-spin mr-2"/>}
                          {emailStatus === 'sent' && <CheckCircle className="mr-2"/>}
                          {emailStatus === 'idle' && <Send className="mr-2" size={18} />}
                          
                          {emailStatus === 'sending' ? 'Sending...' : emailStatus === 'sent' ? 'Sent!' : 'Send Broadcast'}
                      </button>
                  </div>
              )}
          </form>
      </div>

      {/* --- CHATBOT MODE SECTION --- */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center">
            <Bot className="mr-3 text-purple-500" /> Obour AI Chatbot
          </h3>
          
          <div className="space-y-6">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700">
                 <div className="flex flex-col">
                   <span className="font-bold dark:text-white flex items-center gap-2">
                     Chatbot Mode
                     {settings.chatbotMode === 'online' ? (
                       <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                         <Wifi size={10} /> Online
                       </span>
                     ) : (
                       <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                         <WifiOff size={10} /> Offline
                       </span>
                     )}
                   </span>
                   <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                     {settings.chatbotMode === 'online' 
                       ? 'Uses Gemini AI API for intelligent responses (requires valid API key)'
                       : 'Uses predefined responses - no API required'
                     }
                   </span>
                 </div>
                 <Switch 
                    checked={settings.chatbotMode === 'online'} 
                    onChange={(v) => setSettings({...settings, chatbotMode: v ? 'online' : 'offline'})} 
                    disabled={!canManageBanner} // Assuming banner permission (or super admin) controls generic site settings for now
                 />
              </div>

              {canManageBanner && (
                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={handleSaveSettings} 
                    disabled={loading}
                    className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95 flex items-center hover-scale"
                  >
                    {loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" size={18} />}
                    Save Settings
                  </button>
                </div>
              )}
          </div>
      </div>
    </div>
  );
};
