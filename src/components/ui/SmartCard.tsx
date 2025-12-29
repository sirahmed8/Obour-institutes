import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface SmartCardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: 'lift' | 'glow' | 'none';
  interactive?: boolean;
}

export const SmartCard: React.FC<SmartCardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = 'lift',
  interactive = false,
  onClick,
  ...props 
}) => {
  const baseStyles = "bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300 relative overflow-hidden";
  
  const hoverStyles = interactive || onClick ? "cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-900/50" : "";

  const motionProps = (interactive || onClick) && hoverEffect !== 'none' ? {
    whileHover: hoverEffect === 'lift' ? { y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" } : {},
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <motion.div
      layout
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
      {...motionProps}
    >
      {/* Subtle Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        {children as React.ReactNode}
      </div>
    </motion.div>
  );
};
