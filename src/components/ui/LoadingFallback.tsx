import React from 'react';

export const LoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-64 w-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);
