import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Smart Popper Logic: Detects available space using LayoutEffect to prevent flickering
  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const requiredHeight = Math.min(options.length * 40 + 20, 240); // Estimate menu height

      // If strictly less space below than required, AND more space above, flip it.
      if (spaceBelow < requiredHeight && spaceAbove > spaceBelow) {
        setMenuPlacement('top');
      } else {
        setMenuPlacement('bottom');
      }
    }
  }, [isOpen, options.length]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 border shadow-sm outline-none 
          ${isOpen 
            ? 'ring-2 ring-indigo-500 border-indigo-500' 
            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
          }
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
        `}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedOption?.icon && <span className="text-indigo-500">{selectedOption.icon}</span>}
          <span className={selectedOption ? 'font-medium' : 'text-gray-400 dark:text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={18} 
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: menuPlacement === 'top' ? 10 : -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
            className={`absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar 
              ${menuPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            `}
          >
            <div className="p-1.5 space-y-1">
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors duration-150 group
                      ${isSelected 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && (
                        <span className={`${isSelected ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-500'}`}>
                          {option.icon}
                        </span>
                      )}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    {isSelected && <Check size={16} className="text-white" />}
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