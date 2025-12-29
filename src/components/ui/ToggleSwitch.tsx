
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled }) => {
  const { dir } = useLanguage();
  
  return (
    <div 
      onClick={() => !disabled && onChange(!checked)} 
      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
        checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <motion.div 
        animate={{ 
          x: dir === 'rtl' 
            ? (checked ? -20 : 0) 
            : (checked ? 20 : 0) 
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="bg-white w-4 h-4 rounded-full shadow-sm"
      />
    </div>
  );
};
