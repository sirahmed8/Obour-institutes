import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link as LinkIcon, Check, Loader2, Globe, HardDrive, Video, FileText, Sparkles, Send } from 'lucide-react';
import { Subject, ResourceType } from '../../../types';
import { DBService } from '../../../services/storage';
import { useAuth } from '../../../context/AuthContext';
import { CustomSelect } from '../../ui/CustomSelect';
import { toast } from 'react-hot-toast';

interface ResourceFormProps {
  subjects: Subject[];
  onSuccess: () => void;
}

export const ResourceForm: React.FC<ResourceFormProps> = ({ subjects = [], onSuccess }) => {
  const { currentUser } = useAuth();
  
  // Debug if subjects are actually arriving
  React.useEffect(() => {
     if (subjects.length === 0) console.warn("ResourceForm received 0 subjects");
  }, [subjects]);
  
  const [subjectId, setSubjectId] = useState('');
  const [resourceType, setResourceType] = useState<'PDF' | 'VIDEO' | 'LINK' | 'DOC'>('LINK'); 
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleUrlBlur = async () => {
    if (!linkUrl || linkTitle) return;
    
    let detectedTitle = "External Resource";
    try {
        const urlObj = new URL(linkUrl);
        const domain = urlObj.hostname.replace('www.', '');
        const path = urlObj.pathname.toLowerCase();
        
        if (domain.includes('youtube') || domain.includes('youtu.be')) {
            detectedTitle = "Video Lecture";
            setResourceType('VIDEO');
        } else if (domain.includes('google') && path.includes('drive')) {
            detectedTitle = "Drive Material";
            setResourceType('DOC');
            if (path.endsWith('.pdf')) setResourceType('PDF');
        } else if (path.endsWith('.pdf')) {
            detectedTitle = "PDF Document";
            setResourceType('PDF');
        }
    } catch (e) {}
    setLinkTitle(detectedTitle);
    toast.success('Analyzing link metadata...', { icon: '✨' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return toast.error("Select a subject first");
    if (!linkUrl) return toast.error("Enter the material URL");
    if (!linkTitle) return toast.error("Enter a title");

    setStatus('uploading');

    try {
      const dbType = resourceType === 'PDF' ? ResourceType.PDF : ResourceType.LINK;

      await DBService.addResource({
        subjectId,
        title: linkTitle,
        description: description || `Resource Type: ${resourceType}`,
        type: dbType,
        url: linkUrl
      });

      if (currentUser) {
        await DBService.logActivity(currentUser.uid, currentUser.email || 'Admin', 'CREATE_SUBJECT', `Published resource: ${linkTitle}`);
      }

      setStatus('success');
      toast.success("Material Published!");
      onSuccess();
      
      setTimeout(() => {
          setLinkUrl('');
          setLinkTitle('');
          setDescription('');
          setStatus('idle');
      }, 1500);

    } catch (err: any) {
      toast.error("Failed to publish.");
      setStatus('error');
    }
  };

  const subjectOptions = subjects.map(s => ({ value: s.id, label: `${s.name} (Dr. ${s.profName})` }));

  const typeOptions = [
      { id: 'LINK', label: 'WEBSITE', icon: Globe, color: 'text-emerald-500' },
      { id: 'PDF', label: 'PDF/BOOK', icon: FileText, color: 'text-rose-500' },
      { id: 'VIDEO', label: 'VIDEO', icon: Video, color: 'text-red-600' },
      { id: 'DOC', label: 'DRIVE', icon: HardDrive, color: 'text-indigo-500' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center">
          <LinkIcon className="mr-4 text-indigo-600" size={32} /> 
          Publish Material
        </h3>
        {status === 'success' && (
          <span className="text-xs font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl flex items-center animate-bounce">
            <Check size={14} className="mr-2" /> LIVE NOW
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
           <label className="block text-xs font-black uppercase text-gray-400 mb-3 tracking-[0.2em]">Target Course</label>
           {subjects.length === 0 ? (
               <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-bold text-center text-sm">
                   No courses available. Create a course first.
               </div>
           ) : (
               <CustomSelect value={subjectId} onChange={setSubjectId} options={subjectOptions} placeholder="Choose Course..." />
           )}
        </div>

        <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-3 tracking-[0.2em]">Resource URL</label>
            <div className="relative">
                <Globe className="absolute left-4 top-4 text-gray-300" size={20}/>
                <input 
                    type="url" 
                    value={linkUrl} 
                    onChange={e => setLinkUrl(e.target.value)} 
                    onBlur={handleUrlBlur}
                    className="w-full pl-12 p-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white text-gray-900 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold outline-none"
                    placeholder="https://drive.google.com/..."
                    required
                />
            </div>
        </div>

        <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-3 tracking-[0.2em]">Asset Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {typeOptions.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => setResourceType(opt.id as any)}
                        className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 ${
                            resourceType === opt.id 
                            ? 'border-indigo-600 bg-indigo-600 text-white scale-105 z-10 shadow-lg shadow-indigo-500/30' 
                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                    >
                        <opt.icon className={`mb-1 sm:mb-2 ${resourceType === opt.id ? 'text-white' : opt.color}`} size={20} />
                        <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wide truncate w-full text-center ${resourceType === opt.id ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`}>{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-black uppercase text-gray-400 mb-3 tracking-[0.2em]">Display Title</label>
                <input 
                    value={linkTitle} 
                    onChange={e => setLinkTitle(e.target.value)} 
                    placeholder="e.g. Chapter 1 PDF"
                    className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white text-gray-900 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold outline-none"
                    required
                />
            </div>
            <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-black uppercase text-gray-400 mb-3 tracking-[0.2em]">Short Info</label>
                <input 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Brief description..."
                    className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white text-gray-900 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold outline-none"
                />
            </div>
        </div>

        <button 
            type="submit" 
            disabled={status === 'uploading'} 
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 transition-all flex items-center justify-center active:scale-95 disabled:opacity-50"
        >
            {status === 'uploading' ? <Loader2 className="animate-spin mr-3"/> : <Send className="mr-3" size={24} />}
            {status === 'uploading' ? 'PUBLISHING...' : 'PUBLISH MATERIAL'}
        </button>
      </form>
    </motion.div>
  );
};