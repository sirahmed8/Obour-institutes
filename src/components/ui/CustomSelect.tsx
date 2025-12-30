
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(containerRef, () => setIsOpen(false));

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-white/20 transition-all font-bold min-h-[56px]"
      >
        <div className="flex items-center gap-3 overflow-hidden">
           {selectedOption?.icon && <span className="text-indigo-200">{selectedOption.icon}</span>}
           <span className="text-sm truncate">
              {selectedOption ? selectedOption.label : placeholder}
           </span>
        </div>
        <ChevronDown size={18} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}/>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden z-30 border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-5 py-3 text-sm font-bold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${value === opt.value ? 'text-indigo-600 dark:text-indigo-400 bg-gray-50 dark:bg-gray-700/50' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <div className="flex items-center gap-2">
                    {opt.icon && <span className="opacity-70">{opt.icon}</span>}
                    {opt.label}
                </div>
                {value === opt.value && <Check size={14}/>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
