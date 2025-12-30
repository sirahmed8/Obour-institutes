
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ExternalLink, Clock, Trash2, Youtube, HardDrive, Globe, Eye, Video } from 'lucide-react';
import { Resource, ResourceType } from '../../types';

interface ResourceCardProps {
  resource: Resource;
  canDelete: boolean;
  onDeleteClick: (id: string) => void;
  onDownloadClick: (resource: Resource) => void; 
  index?: number;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
  resource, 
  canDelete, 
  onDeleteClick,
  onDownloadClick,
  index
}) => {
  const urlLower = resource.url.toLowerCase();
  
  // --- Smart Detection Logic ---
  // Detect actual type from URL or DB type
  const isPDF = resource.type === ResourceType.PDF || urlLower.endsWith('.pdf');
  const isVideo = urlLower.includes('youtube') || urlLower.includes('youtu.be') || urlLower.includes('vimeo');
  const isDrive = urlLower.includes('drive.google') && !isPDF; 
  
  const getIcon = () => {
      if (isPDF) return <FileText size={32} className="text-white drop-shadow-md"/>;
      if (isVideo) return <Youtube size={32} className="text-white drop-shadow-md"/>;
      if (isDrive) return <HardDrive size={32} className="text-white drop-shadow-md"/>;
      return <Globe size={32} className="text-white drop-shadow-md"/>;
  };

  const getBgColor = () => {
      if (isPDF) return "bg-gradient-to-br from-red-500 to-rose-600"; 
      if (isVideo) return "bg-gradient-to-br from-red-600 to-red-700"; 
      if (isDrive) return "bg-gradient-to-br from-blue-500 to-cyan-600"; 
      return "bg-gradient-to-br from-emerald-500 to-teal-600"; 
  };

  const getLabel = () => {
      if (isPDF) return "PDF Document";
      if (isVideo) return "Video Lecture";
      if (isDrive) return "Google Drive";
      return "External Link";
  };

  const formatDateTime = (iso: string) => {
      if (!iso) return '';
      return new Date(iso).toLocaleString('en-GB', { 
          day: 'numeric', month: 'short' 
      });
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 overflow-hidden"
    >
        <div className="flex gap-5 items-start">
            {/* Rich Icon Box */}
            <div className={`shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${getBgColor()} transition-transform duration-300 group-hover:scale-105`}>
                {getIcon()}
            </div>

            {/* Content Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div className="mb-2">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 block">
                            {index && <span className="text-indigo-500 mr-1">#{index}</span>}
                            {getLabel()}
                        </span>
                        {canDelete && (
                             <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteClick(resource.id); }} 
                                className="text-gray-300 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                title="Delete Resource"
                             >
                                 <Trash2 size={16} />
                             </button>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {resource.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {resource.description !== 'External Link' ? resource.description : 'Click to access content'}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md">
                        <Clock size={12} className="mr-1.5"/>
                        {formatDateTime(resource.dateAdded)}
                    </div>
                    
                    {/* Native Link for Reliability */}
                    <a 
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onDownloadClick(resource)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all shadow-sm group-hover:shadow-md no-underline"
                    >
                        <ExternalLink size={14} /> Open
                    </a>
                </div>
            </div>
        </div>
    </motion.div>
  );
};
