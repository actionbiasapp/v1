'use client';

import React from 'react';

interface ActionButtonsProps {
  onEdit: (e?: React.MouseEvent) => void;
  onDelete: (e?: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function ActionButtons({ 
  onEdit, 
  onDelete, 
  size = 'md',
  disabled = false,
  className = ''
}: ActionButtonsProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`flex gap-2 action-buttons ${className}`}>
      <button
        onClick={onEdit}
        disabled={disabled}
        className={`
          ${sizeClasses[size]} rounded-full bg-blue-600 text-white shadow-sm 
          flex items-center justify-center hover:bg-blue-700 
          focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title="Edit"
        aria-label="Edit"
      >
        <svg 
          className={iconSizes[size]} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
          />
        </svg>
      </button>
      
      <button
        onClick={onDelete}
        disabled={disabled}
        className={`
          ${sizeClasses[size]} rounded-full bg-red-600 text-white shadow-sm 
          flex items-center justify-center hover:bg-red-700 
          focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title="Delete"
        aria-label="Delete"
      >
        <svg 
          className={iconSizes[size]} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
          />
        </svg>
      </button>
    </div>
  );
} 