import React from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  color?: 'indigo' | 'emerald' | 'blue' | 'purple';
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
  };

  return (
    <button
      onClick={onChange}
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none border-2 border-transparent
        ${checked ? colorClasses[color] : 'bg-gray-200 dark:bg-gray-700'}
      `}
    >
      <span className="sr-only">Toggle setting</span>
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0
        `}
        animate={{
            x: checked ? 20 : 0
        }}
      />
    </button>
  );
};
