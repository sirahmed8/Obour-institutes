
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown, Check, ArrowDownUp } from 'lucide-react'; // Added generic icon
import { motion, AnimatePresence } from 'framer-motion';

export interface Option {
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
  triggerClassName?: string; 
  icon?: React.ReactNode; // Optional trigger icon
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  className,
  triggerClassName,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        setMenuPlacement('top');
      } else {
        setMenuPlacement('bottom');
      }
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between transition-all duration-300 outline-none focus:outline-none focus:ring-0
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-transparent
          ${isOpen 
            ? 'ring-4 ring-indigo-500/20 border-indigo-500 shadow-xl z-20' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
          }
          ${triggerClassName ? triggerClassName : 'p-3.5 rounded-2xl'}
        `}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedOption?.icon ? (
            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-lg">
                {selectedOption.icon}
            </span>
          ) : icon ? (
            <span className="text-gray-400">{icon}</span>
          ) : null}
          
          <div className="flex flex-col items-start">
             {selectedOption && <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-none mb-0.5">Sort By</span>}
             <span className={`font-bold leading-tight ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                {selectedOption ? selectedOption.label : placeholder}
             </span>
          </div>
        </div>
        <div className={`p-1.5 rounded-full transition-all duration-300 ${isOpen ? 'bg-indigo-100 dark:bg-indigo-900/50 rotate-180' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <ChevronDown 
            size={16} 
            className={`transition-colors ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`} 
            />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: menuPlacement === 'top' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={`absolute z-[60] w-full min-w-[220px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border border-gray-100/50 dark:border-gray-700/50 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] p-2 max-h-80 overflow-y-auto custom-scrollbar 
              ${menuPlacement === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'}
            `}
          >
            <div className="space-y-1">
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all duration-200 group outline-none focus:outline-none relative overflow-hidden
                      ${isSelected 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      {option.icon && (
                        <span className={`p-1 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-white text-gray-500 dark:text-gray-400 group-hover:text-indigo-500'}`}>
                          {React.cloneElement(option.icon as React.ReactElement<any>, { size: 16 })}
                        </span>
                      )}
                      <span className="font-bold text-sm">{option.label}</span>
                    </div>
                    {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white/20 p-1 rounded-full">
                            <Check size={14} className="text-white" />
                        </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
