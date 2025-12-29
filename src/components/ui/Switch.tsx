import React from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  color?: 'indigo' | 'emerald' | 'purple'; // Restricted to premium colors
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500', 
    purple: 'bg-purple-600',
  };

  return (
    <button
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none 
        ${checked ? colorClasses[color] : 'bg-slate-600'}
      `}
    >
      <span className="sr-only">Toggle setting</span>
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-md
        `}
        animate={{
            x: checked ? 20 : 2 // Slight offset for inner padding look
        }}
      />
    </button>
  );
};
