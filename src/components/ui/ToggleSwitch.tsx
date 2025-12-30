import React from 'react';
import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'indigo' | 'emerald' | 'purple';
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  checked, 
  onChange, 
  disabled,
  color = 'emerald'
}) => {
  const colorClasses = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-600',
  };
  
  return (
    <button 
      type="button"
      onClick={() => !disabled && onChange(!checked)} 
      disabled={disabled}
      className={`
        relative inline-flex h-[30px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2
        ${checked ? colorClasses[color] : 'bg-[#E9E9EA] dark:bg-[#39393D]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        /* Use LTR direction always for the internal mechanics to prevent flipping issues */
      `}
      dir="ltr" 
      role="switch"
      aria-checked={checked}
    >
      <span className="sr-only">Toggle</span>
      <motion.span 
        initial={false}
        animate={{ 
          x: checked ? 20 : 0, // Adjusted for h-30/w-50 minus borders/padding
          scale: 1 
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="pointer-events-none inline-block h-[26px] w-[26px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
      />
    </button>
  );
};
