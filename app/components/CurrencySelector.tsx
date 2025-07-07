// /components/CurrencySelector.tsx
// Currency input component with amount and currency selection

'use client';

import { useState, useEffect } from 'react';
import { type CurrencyCode, CURRENCY_INFO, formatCurrency, validateCurrencyAmount } from '@/app/lib/currency';

interface CurrencySelectorProps {
  value: number;
  currency: CurrencyCode;
  onValueChange: (value: number) => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showConversion?: boolean;
  className?: string;
}

interface ConversionPreview {
  SGD: number;
  INR: number;
  USD: number;
}

export default function CurrencySelector({
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  label = "Amount",
  placeholder = "Enter amount",
  disabled = false,
  showConversion = true,
  className = ""
}: CurrencySelectorProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [conversion, setConversion] = useState<ConversionPreview | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Validate input and update parent
  const handleValueChange = (newValue: string) => {
    setInputValue(newValue);
    
    const validation = validateCurrencyAmount(newValue);
    setIsValid(validation.isValid);
    setErrorMessage(validation.error || '');
    
    if (validation.isValid && validation.value !== undefined) {
      onValueChange(validation.value);
      
      // Fetch conversion preview if amount is valid and > 0
      if (validation.value > 0 && showConversion) {
        fetchConversion(validation.value, currency);
      }
    }
  };

  // Fetch currency conversion preview
  const fetchConversion = async (amount: number, fromCurrency: CurrencyCode) => {
    setIsConverting(true);
    try {
      const response = await fetch('/api/exchange-rates/convert', { // ✅ FIXED: Correct API path
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          fromCurrency,
          convertToAll: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConversion({
            SGD: data.SGD,      // ✅ FIXED: Match new API response format
            INR: data.INR,
            USD: data.USD
          });
        }
      }
    } catch (error) {
      console.error('Error fetching conversion:', error);
    } finally {
      setIsConverting(false);
    }
  };

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  // Fetch conversion when currency changes
  useEffect(() => {
    if (value > 0 && showConversion) {
      fetchConversion(value, currency);
    }
  }, [currency, value, showConversion]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      
      {/* Input Group */}
      <div className="flex gap-2">
        {/* Amount Input */}
        <div className="flex-1">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full bg-slate-700 border rounded-lg px-3 py-2 text-white placeholder-slate-400
              focus:outline-none focus:ring-2 transition-colors
              ${isValid 
                ? 'border-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20' 
                : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            step="0.01"
            min="0"
          />
          
          {/* Error Message */}
          {!isValid && errorMessage && (
            <p className="text-red-400 text-xs mt-1">{errorMessage}</p>
          )}
        </div>
        
        {/* Currency Selector */}
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
          disabled={disabled}
          className={`
            bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white
            focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
            transition-colors min-w-[80px]
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {Object.entries(CURRENCY_INFO).map(([code, info]) => (
            <option key={code} value={code}>
              {info.flag} {code}
            </option>
          ))}
        </select>
      </div>
      
      {/* Conversion Preview */}
      {showConversion && conversion && value > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
            <span>Conversion Preview</span>
            {isConverting && (
              <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-sm">
            {Object.entries(CURRENCY_INFO).map(([code, info]) => {
              const amount = conversion[code as CurrencyCode];
              const isSelected = code === currency;
              
              return (
                <div 
                  key={code}
                  className={`text-center p-2 rounded ${
                    isSelected 
                      ? 'bg-indigo-900/30 border border-indigo-600/30 text-indigo-300' 
                      : 'bg-slate-700/30 text-slate-300'
                  }`}
                >
                  <div className="text-xs text-slate-400">{info.flag} {code}</div>
                  <div className="font-medium">
                    {formatCurrency(amount, code as CurrencyCode, { compact: true, precision: 0 })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}