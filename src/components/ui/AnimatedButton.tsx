import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isAlive?: boolean; // Enable "breath" animation when idle
  shine?: boolean;   // Enable "shine" effect
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  leftIcon,
  rightIcon,
  isAlive,
  shine,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-bold tracking-wide rounded-xl focus:outline-none transition-all duration-300 overflow-hidden";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50",
    secondary: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 shadow-sm",
    danger: "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600",
    outline: "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base"
  };

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${isAlive && !disabled ? 'animate-breath' : ''} 
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Shine Effect */}
      {shine && !disabled && (
        <div className="absolute inset-0 -translate-x-[200%] animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
      )}

      {isLoading ? (
        <Loader2 className="animate-spin mr-2" size={size === 'sm' ? 14 : 18} />
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}

      <span className="relative z-10">{children as React.ReactNode}</span>

      {!isLoading && rightIcon && (
        <span className="ml-2 relative z-10">{rightIcon}</span>
      )}
    </motion.button>
  );
};
