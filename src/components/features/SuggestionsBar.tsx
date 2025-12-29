import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Grid, ArrowDownWideNarrow, ArrowUpWideNarrow, Layers, Calendar, Type, Clock } from 'lucide-react';

interface SuggestionsBarProps {
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

export const SuggestionsBar: React.FC<SuggestionsBarProps> = ({ onFilterChange, activeFilter }) => {
  const chips = [
    { id: 'all', label: 'View All', icon: Grid },
    { id: 'date_desc', label: 'Newest First', icon: Clock },
    { id: 'date_asc', label: 'Oldest First', icon: Calendar },
    { id: 'name_asc', label: 'Name: A-Z', icon: Type },
    { id: 'name_desc', label: 'Name: Z-A', icon: Type },
    { id: 'ai', label: '✨ Obour AI', icon: Sparkles },
  ];

  return (
    <div className="w-full mb-10">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Layers size={18} className="text-indigo-600" />
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Browse Options</h3>
      </div>
      
      <div className="overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 w-max">
          {chips.map((chip, idx) => {
            const isActive = activeFilter === chip.id;
            
            return (
              <motion.button
                key={chip.id}
                onClick={() => onFilterChange(chip.id)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-[1.2rem] border transition-all whitespace-nowrap shadow-sm
                  ${isActive 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/40 font-black scale-105 z-10' 
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:border-indigo-400 hover:shadow-lg font-bold'
                  }`}
              >
                 <div className="flex items-center justify-center w-5 h-5">
                    <chip.icon size={20} className={isActive ? "text-white" : "text-indigo-500"} />
                 </div>
                 <span className="text-sm tracking-tight">{chip.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};