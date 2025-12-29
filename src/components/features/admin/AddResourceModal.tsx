
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, X, AlertCircle, File as FileIcon, XCircle, Sparkles, Globe } from 'lucide-react';
import { Subject, ResourceType } from '../../../types';
import { DBService } from '../../../services/storage';
import { useAuth } from '../../../context/AuthContext';
import { CustomSelect } from '../../ui/CustomSelect';
import { toast } from 'react-hot-toast';

interface AddResourceModalProps {
  subjects: Subject[];
  onSuccess: () => void;
}

interface UploadFileItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({ subjects, onSuccess }) => {
  const { currentUser } = useAuth();
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState<ResourceType>(ResourceType.PDF);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [isDetectingTitle, setIsDetectingTitle] = useState(false);
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Drag Counter to prevent flicker when dragging over children
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
  };

  const handleDrop = (e: React.DragEvent) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { 
      setType(ResourceType.PDF); 
      addFiles(Array.from(e.dataTransfer.files)); 
    } 
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files) addFiles(Array.from(e.target.files)); 
  };

  const addFiles = (newFiles: File[]) => {
    const items: UploadFileItem[] = newFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      progress: 0,
      status: 'pending',
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
    }));
    setFiles(prev => [...prev, ...items]);
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const handleUrlBlur = async () => {
    if (!linkUrl || linkTitle) return;
    setIsDetectingTitle(true);
    setTimeout(() => {
        let detectedTitle = "External Resource";
        try {
            const urlObj = new URL(linkUrl);
            const domain = urlObj.hostname.replace('www.', '').split('.')[0];
            const path = urlObj.pathname.split('/').pop()?.replace(/-/g, ' ') || "";
            if (domain.includes('youtube')) detectedTitle = "YouTube Video";
            else detectedTitle = domain.charAt(0).toUpperCase() + domain.slice(1) + " - " + path;
        } catch (e) { detectedTitle = "Web Resource"; }
        setLinkTitle(detectedTitle);
        setIsDetectingTitle(false);
        toast('Link title auto-generated', { icon: '✨' });
    }, 800);
  };

  const processUploads = async () => {
    if (!subjectId) return toast.error("Please select a subject first.");

    if (type === ResourceType.PDF) {
      const pending = files.filter(f => f.status === 'pending');
      if (pending.length === 0) return toast.error("No files selected.");

      for (const item of pending) {
        updateFileStatus(item.id, { status: 'uploading', progress: 10 });
        try {
          const result = await DBService.uploadFile(item.file);
          updateFileStatus(item.id, { progress: 80 });
          const cleanName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
          await DBService.addResource({
            subjectId,
            title: cleanName,
            description: `Uploaded file`,
            type: ResourceType.PDF,
            url: result.url
          });
          updateFileStatus(item.id, { status: 'success', progress: 100 });
        } catch (error: any) {
          updateFileStatus(item.id, { status: 'error', error: error.message });
        }
      }
      toast.success("Batch processing complete!");
      onSuccess();
      // Auto clear successes
      setTimeout(() => setFiles(prev => prev.filter(f => f.status !== 'success')), 3000);

    } else {
      if (!linkUrl || !linkTitle) return toast.error("Fill in URL details.");
      try {
        await DBService.addResource({
          subjectId,
          title: linkTitle,
          description: 'External Link',
          type: ResourceType.LINK,
          url: linkUrl
        });
        setLinkUrl('');
        setLinkTitle('');
        onSuccess();
        toast.success("Link added successfully!");
      } catch(e) { console.error(e); toast.error("Failed to add link"); }
    }
  };

  const updateFileStatus = (id: string, updates: Partial<UploadFileItem>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const subjectOptions = subjects.map(s => ({ value: s.id, label: `${s.name} (Dr. ${s.profName})` }));

  return (
    <div 
      className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 relative transition-all duration-300 ${isDragging ? 'ring-4 ring-indigo-500/30 bg-indigo-50 dark:bg-indigo-900/10 scale-[1.01]' : ''}`}
      onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
    >
      {isDragging && (
          <div className="absolute inset-0 z-50 bg-indigo-600/10 backdrop-blur-sm rounded-2xl flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl transform scale-110">
                  <Upload className="w-16 h-16 text-indigo-600 mx-auto animate-bounce" />
                  <p className="text-xl font-bold text-indigo-900 dark:text-indigo-200 mt-4">Drop files to upload instantly</p>
              </div>
          </div>
      )}

      <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center">
        <Upload className="mr-2 text-indigo-500"/> Upload Resources
      </h3>
      
      <div className="space-y-6">
        <div>
           <label className="block text-sm font-bold mb-2 dark:text-gray-300">Subject</label>
           <CustomSelect value={subjectId} onChange={setSubjectId} options={subjectOptions} placeholder="Select Subject..." />
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
           <button onClick={() => setType(ResourceType.PDF)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === ResourceType.PDF ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>File Upload</button>
           <button onClick={() => setType(ResourceType.LINK)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === ResourceType.LINK ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>External Link</button>
        </div>

        {type === ResourceType.PDF ? (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
             <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragging ? 'border-indigo-500' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'}`}>
                <input type="file" multiple onChange={handleFileInput} className="hidden" id="multi-file" />
                <label htmlFor="multi-file" className="cursor-pointer block">
                    <div className="bg-indigo-50 dark:bg-indigo-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform">
                        <Upload className="text-indigo-600 dark:text-indigo-400" size={32}/>
                    </div>
                    <p className="font-bold text-gray-700 dark:text-gray-200">Click to browse or Drag & Drop</p>
                    <p className="text-sm text-gray-500 mt-1">PDFs, Images, Docs supported</p>
                </label>
             </div>

             <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                <AnimatePresence>
                   {files.map(f => (
                       <motion.div 
                        key={f.id} 
                        initial={{opacity:0, x: -20, height: 0}} 
                        animate={{opacity:1, x: 0, height: 'auto'}} 
                        exit={{opacity:0, x: 20, height: 0, transition: {duration: 0.2}}} 
                        className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700"
                       >
                           {f.preview ? <img src={f.preview} className="w-10 h-10 rounded-lg object-cover bg-white"/> : <div className="p-2 bg-white dark:bg-gray-600 rounded-lg"><FileIcon size={20}/></div>}
                           <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold truncate dark:text-white">{f.file.name}</p>
                               {f.status !== 'success' && (
                                 <div className="w-full bg-gray-200 dark:bg-gray-600 h-1.5 rounded-full mt-1 overflow-hidden">
                                     <motion.div className={`h-full ${f.status === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`} initial={{width: 0}} animate={{width: `${f.progress}%`}} />
                                 </div>
                               )}
                           </div>
                           {f.status === 'pending' && <button onClick={() => removeFile(f.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><XCircle size={20}/></button>}
                           {f.status === 'success' && <motion.div initial={{scale:0}} animate={{scale:1}}><Check size={20} className="text-green-500"/></motion.div>}
                           {f.status === 'error' && <AlertCircle size={20} className="text-red-500"/>}
                       </motion.div>
                   ))}
                </AnimatePresence>
             </div>

             <button onClick={processUploads} disabled={files.filter(f => f.status === 'pending').length === 0} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                Upload {files.filter(f => f.status === 'pending').length} Files
             </button>
          </motion.div>
        ) : (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
             <div className="relative">
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">URL</label>
                <div className="relative">
                    <Globe className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                    <input 
                        type="url" 
                        value={linkUrl} 
                        onChange={e => setLinkUrl(e.target.value)} 
                        onBlur={handleUrlBlur}
                        className="w-full pl-10 p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                        placeholder="Paste link here (e.g. YouTube, Drive)..."
                    />
                </div>
             </div>
             <div>
                <label className="block text-sm font-bold mb-1 dark:text-gray-300 flex justify-between">
                    Link Title
                    {isDetectingTitle && <span className="text-indigo-500 text-xs flex items-center animate-pulse"><Sparkles size={10} className="mr-1"/> AI Generating...</span>}
                </label>
                <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="Auto-generated or type custom title" />
             </div>
             <button onClick={processUploads} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95">Add Smart Link</button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
