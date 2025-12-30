import React from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out 
          ${checked ? 'bg-indigo-600' : 'bg-slate-700 dark:bg-slate-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:ring-0
        `}
    >
      <span className="sr-only">Toggle</span>
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        initial={false}
        animate={{ x: checked ? 20 : 0 }}
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 
          transition duration-200 ease-in-out
        `}
      />
    </button>
  );
};
