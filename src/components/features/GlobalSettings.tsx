
import React, { useState, useEffect } from 'react';
import { Megaphone, Trash2, Save, Loader2, Mail, Send, CheckCircle } from 'lucide-react';
import { DBService } from '../../services/storage';
import { SystemSettings } from '../../types';
import { toast } from 'react-hot-toast';
import { ToggleSwitch } from '../ui/ToggleSwitch';

export const GlobalSettings: React.FC<{ canEdit: boolean }> = ({ canEdit }) => {
  const [settings, setSettings] = useState<SystemSettings>({ 
    announcement: '', 
    showAnnouncement: false
  });
  
  // Email State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await DBService.getSettings();
    setSettings(data);
  };

  const handleSaveSettings = async () => {
    if (!canEdit) return toast.error("Permission Denied");
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
    if (!canEdit) return toast.error("Permission Denied");
    
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
      if (!canEdit) return toast.error("Permission Denied");
      if (!emailSubject || !emailBody) return toast.error("Please fill all email fields");

      setEmailStatus('sending');
      try {
          await DBService.sendBroadcast(emailSubject, emailBody);
          toast.success("Broadcast sent to queue");
          setEmailStatus('sent');
          setTimeout(() => {
              setEmailSubject('');
              setEmailBody('');
              setEmailStatus('idle');
          }, 2000);
      } catch (e) {
          toast.error("Failed to send broadcast");
          setEmailStatus('idle');
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center">
          <Megaphone className="mr-3 text-indigo-500" /> Announcement Banner
        </h3>
        
        <div className="space-y-8">
          
          {/* Announcement Banner */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                 Banner Message
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
              className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white min-h-[120px] focus:ring-2 focus:ring-indigo-500 transition-all resize-y shadow-inner"
            />
          </div>

          {/* Banner Toggle */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
             <div className="flex flex-col">
               <span className="font-bold dark:text-white">Enable Banner Display</span>
               <span className="text-xs text-gray-500 dark:text-gray-400">Toggle visibility without deleting the text.</span>
             </div>
             <ToggleSwitch 
                checked={settings.showAnnouncement} 
                onChange={(v) => setSettings({...settings, showAnnouncement: v})} 
                disabled={!canEdit}
             />
          </div>

          {canEdit && (
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
                      disabled={!canEdit}
                  />
              </div>
              
              <div>
                  <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide block mb-2">Message Body (HTML Supported)</label>
                  <textarea 
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      placeholder="Dear students..."
                      className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white min-h-[150px] focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-sm"
                      disabled={!canEdit}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                      Note: This will also create a system notification in the 'Inbox' page for all users.
                  </p>
              </div>

              {canEdit && (
                  <div className="flex justify-end">
                      <button 
                          type="submit"
                          disabled={emailStatus === 'sending' || emailStatus === 'sent'}
                          className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center hover-scale text-white
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
    </div>
  );
};
