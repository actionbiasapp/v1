// /components/CurrencyToggle.tsx
// Portfolio currency display switcher

'use client';

import { type CurrencyCode, CURRENCY_INFO } from '@/app/lib/currency';

interface CurrencyToggleProps {
  displayCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export default function CurrencyToggle({
  displayCurrency,
  onCurrencyChange,
  className = "",
  variant = 'default'
}: CurrencyToggleProps) {
  
  if (variant === 'compact') {
    return (
      <div className={`flex bg-slate-800/50 rounded-lg p-1 border border-slate-700 ${className}`}>
        {Object.entries(CURRENCY_INFO).map(([code, info]) => {
          const isSelected = code === displayCurrency;
          
          return (
            <button
              key={code}
              onClick={() => onCurrencyChange(code as CurrencyCode)}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }
              `}
            >
              {info.flag} {code}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`inline-flex bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1 ${className}`}>
      {Object.entries(CURRENCY_INFO).map(([code, info]) => {
        const isSelected = code === displayCurrency;
        
        return (
          <button
            key={code}
            onClick={() => onCurrencyChange(code as CurrencyCode)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-300 ease-out
              ${isSelected
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:scale-102'
              }
            `}
          >
            <span className="text-base">{info.flag}</span>
            <span>{code}</span>
            {isSelected && (
              <div className="w-2 h-2 bg-white rounded-full opacity-80" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Simplified version for dashboard header
export function CurrencyToggleSimple({
  displayCurrency,
  onCurrencyChange,
  className = ""
}: Omit<CurrencyToggleProps, 'variant'>) {
  return (
    <div className={`flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 ${className}`}>
      {Object.entries(CURRENCY_INFO).map(([code, info]) => {
        const isSelected = code === displayCurrency;
        
        return (
          <button
            key={code}
            onClick={() => onCurrencyChange(code as CurrencyCode)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${isSelected
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }
            `}
            title={`View portfolio in ${info.name}`}
          >
            {info.flag} {code}
          </button>
        );
      })}
    </div>
  );
}