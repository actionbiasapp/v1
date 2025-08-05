'use client';

import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
  text?: string;
  color?: 'white' | 'blue' | 'green' | 'gray';
}

export default function Loader({ 
  size = 'md', 
  variant = 'spinner',
  className = '',
  text,
  color = 'white'
}: LoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    white: 'text-white',
    blue: 'text-blue-400',
    green: 'text-green-400',
    gray: 'text-gray-400'
  };

  const renderSpinner = () => (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );

  const renderDots = () => (
    <div className={`flex space-x-1 ${colorClasses[color]}`}>
      <div className={`${sizeClasses.sm} bg-current rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`${sizeClasses.sm} bg-current rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`${sizeClasses.sm} bg-current rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-pulse bg-current rounded-full`}></div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      {renderLoader()}
      {text && (
        <p className={`text-sm ${colorClasses[color]} text-center`}>
          {text}
        </p>
      )}
    </div>
  );
}

// Specialized loaders for common use cases
export function CardLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <Loader size="md" variant="spinner" text="Loading data..." className="py-8" />
    </div>
  );
}

export function ChartLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 ${className}`}>
      <div className="h-80 flex items-center justify-center">
        <Loader size="lg" variant="spinner" text="Loading chart data..." color="gray" />
      </div>
    </div>
  );
}

export function MetricsLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-700 ${className}`}>
      <div className="grid grid-cols-3 lg:flex lg:gap-8 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-8 bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
} 