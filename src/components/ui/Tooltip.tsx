import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 0.2 }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: { bottom: '100%', left: '50%', x: '-50%', y: -10 },
    bottom: { top: '100%', left: '50%', x: '-50%', y: 10 },
    left: { right: '100%', top: '50%', y: '-50%', x: -10 },
    right: { left: '100%', top: '50%', y: '-50%', x: 10 },
  };

  return (
    <div 
      className="relative inline-block z-10"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, ...positions[position] }}
            animate={{ opacity: 1, scale: 1, ...positions[position] }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, delay }}
            className={`absolute px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg pointer-events-none z-50`}
            style={{ 
                [position === 'top' || position === 'bottom' ? 'marginBottom' : 'marginRight']: position === 'top' || position === 'left' ? '8px' : '0',
                [position === 'bottom' || position === 'right' ? 'marginTop' : 'marginLeft']: position === 'bottom' || position === 'right' ? '8px' : '0'
            }}
          >
            {content}
            {/* Arrow */}
            <div 
                className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                    position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                    position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                    position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                    'left-[-4px] top-1/2 -translate-y-1/2'
                }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
};
