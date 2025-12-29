import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Link as LinkIcon, ExternalLink, Clock, Trash2, Youtube, HardDrive, Globe, Eye, Image as ImageIcon } from 'lucide-react';
import { Resource, ResourceType } from '../types';
import { DBService } from '../services/storage';
import { SmartCard } from './ui/SmartCard';

interface ResourceCardProps {
  resource: Resource;
  canDelete: boolean;
  onDeleteClick: (id: string) => void;
  onDownloadClick: (resource: Resource) => void; // Kept props signature but changed behavior
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
  resource, 
  canDelete, 
  onDeleteClick, 
  onDownloadClick 
}) => {
  const isPDF = resource.type === ResourceType.PDF;
  
  // Smart Link Logic
  const getSmartConfig = () => {
      const url = resource.url.toLowerCase();
      if (isPDF) return { icon: <FileText size={32}/>, color: "bg-rose-500", label: "Document", bg: "from-rose-500/10 to-transparent" };
      if (url.includes('youtube') || url.includes('youtu.be')) return { icon: <Youtube size={32}/>, color: "bg-red-600", label: "Video", bg: "from-red-600/10 to-transparent" };
      if (url.includes('drive.google')) return { icon: <HardDrive size={32}/>, color: "bg-emerald-600", label: "Drive", bg: "from-emerald-600/10 to-transparent" };
      return { icon: <Globe size={32}/>, color: "bg-indigo-500", label: "Link", bg: "from-indigo-500/10 to-transparent" };
  };

  const config = getSmartConfig();

  // Thumbnail Logic
  const hasPreview = isPDF || resource.url.match(/\.(jpeg|jpg|png|webp)$/i);
  const thumbnailUrl = hasPreview ? DBService.getThumbnailUrl(resource.url, resource.type) : null;

  const handleView = async (e: React.MouseEvent) => {
    e.preventDefault();
    onDownloadClick(resource); 
    window.open(resource.url, '_blank');
  };

  const formatDateTime = (iso: string) => {
      if (!iso) return '';
      return new Date(iso).toLocaleString('en-GB', { 
          day: 'numeric', month: 'short' 
      });
  };

  return (
    <motion.div layout>
      <SmartCard 
        interactive 
        hoverEffect="lift"
        onClick={handleView}
        className="group h-full flex flex-col relative"
      >
          <div className="absolute top-0 right-0 p-3 z-20">
             {canDelete && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteClick(resource.id); }} 
                    className="p-1.5 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                    title="Delete Resource"
                 >
                     <Trash2 size={16} />
                 </button>
             )}
          </div>

          <div className="flex gap-4 p-4 items-start">
              {/* Preview Icon/Image */}
              <div className={`relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center ${config.color} text-white`}>
                   {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"/>
                   ) : (
                      <div className="group-hover:scale-110 transition-transform duration-300">
                          {config.icon}
                      </div>
                   )}
                   {/* Shine */}
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors`}>
                        {config.label}
                      </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {resource.title}
                  </h3>
                  <div className="flex items-center text-xs text-gray-400 font-medium mt-auto">
                    <Clock size={12} className="mr-1"/> {formatDateTime(resource.dateAdded)}
                  </div>
              </div>
          </div>
          
          {/* Bottom active highlight */}
          <div className={`h-1 w-0 group-hover:w-full transition-all duration-500 ${config.color} mt-auto opacity-80`}></div>
      </SmartCard>
    </motion.div>
  );
};
