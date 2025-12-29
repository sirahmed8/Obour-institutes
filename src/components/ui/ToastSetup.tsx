import React from 'react';
import { Toaster } from 'react-hot-toast';

export const ToastSetup: React.FC = () => {
  return (
    <Toaster 
      position="top-right"
      containerStyle={{ top: 80 }}
      toastOptions={{
        // GOLD MASTER: Limit simultaneous toasts
        duration: 3000,
        className: 'dark:bg-gray-800 dark:text-white dark:border dark:border-gray-700',
        style: {
          borderRadius: '16px',
          background: '#333',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: '16px',
          fontSize: '14px',
          fontWeight: 500
        },
        success: {
          style: {
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0'
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#ecfdf5',
          },
        },
        error: {
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fef2f2',
          },
        },
      }}
    />
  );
};