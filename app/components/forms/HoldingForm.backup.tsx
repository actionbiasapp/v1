'use client';

import React, { useCallback, useMemo } from 'react';
import { type CurrencyCode } from '@/app/lib/currency';
import { HoldingFormData } from '@/app/lib/types/shared';

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  amount: number;
  onAmountChange: (amount: number) => void;
}

// Currency selector component
const CurrencySelector = React.memo(({ value, onChange, amount, onAmountChange }: CurrencySelectorProps) => {
  const handleCurrencyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as CurrencyCode);
  }, [onChange]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onAmountChange(Number(e.target.value));
  }, [onAmountChange]);

  const containerStyle = useMemo(() => ({ position: 'relative' as const, zIndex: 10 }), []);
  const inputStyle = useMemo(() => ({ position: 'relative' as const, zIndex: 10 }), []);

  return (
    <div className="flex gap-2" style={containerStyle}>
      <select
        value={value}
        onChange={handleCurrencyChange}
        className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-sm"
        style={inputStyle}
      >
        <option value="SGD">SGD</option>
        <option value="USD">USD</option>
        <option value="INR">INR</option>
      </select>
      <input
        type="number"
        value={amount}
        onChange={handleAmountChange}
        className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-1 text-sm flex-1"
        placeholder="Amount"
        min="0"
        step="0.01"
        autoComplete="off"
        style={inputStyle}
      />
    </div>
  );
});

CurrencySelector.displayName = 'CurrencySelector';

interface HoldingFormProps {
  categoryName: string; 
  holdingId?: string;
  formData: HoldingFormData;
  onFormDataChange: (data: HoldingFormData) => void;
  onSubmit: (categoryName: string, holdingId?: string) => void;
  onCancel: () => void;
  loading: boolean;
}

// Main holding form component
const HoldingForm = React.memo(({ 
  categoryName, 
  holdingId, 
  formData, 
  onFormDataChange, 
  onSubmit, 
  onCancel, 
  loading 
}: HoldingFormProps) => {
  // Stable event handlers
  const handleSymbolChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, symbol: e.target.value });
  }, [formData, onFormDataChange]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, name: e.target.value });
  }, [formData, onFormDataChange]);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({ ...formData, location: e.target.value });
  }, [formData, onFormDataChange]);

  const handleCurrencyChange = useCallback((currency: CurrencyCode) => {
    onFormDataChange({ ...formData, currency });
  }, [formData, onFormDataChange]);

  const handleAmountChange = useCallback((amount: number) => {
    onFormDataChange({ ...formData, amount });
  }, [formData, onFormDataChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(categoryName, holdingId);
  }, [categoryName, holdingId, onSubmit]);

  // Memoized styles
  const containerStyle = useMemo(() => ({
    overflow: 'visible' as const,
    position: 'static' as const,
    isolation: 'isolate' as const
  }), []);

  const gridStyle = useMemo(() => ({
    overflow: 'visible' as const,
    contain: 'none' as const
  }), []);

  const inputStyle = useMemo(() => ({
    position: 'relative' as const,
    zIndex: 10
  }), []);

  return (
    <div 
      className="bg-slate-800 rounded-lg p-4 border border-slate-600 mb-4"
      style={containerStyle}
    >
      <h4 className="text-white font-medium mb-3">
        {holdingId ? 'Edit Holding' : `Add to ${categoryName}`}
      </h4>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" style={gridStyle}>
          <input
            type="text"
            placeholder="Symbol (e.g., AAPL)"
            value={formData.symbol}
            onChange={handleSymbolChange}
            className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
            autoComplete="off"
            style={inputStyle}
          />
          
          <input
            type="text"
            placeholder="Company Name"
            value={formData.name}
            onChange={handleNameChange}
            className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
            autoComplete="off"
            style={inputStyle}
          />
          
          <div style={inputStyle}>
            <CurrencySelector
              value={formData.currency}
              onChange={handleCurrencyChange}
              amount={formData.amount}
              onAmountChange={handleAmountChange}
            />
          </div>
          
          <input
            type="text"
            placeholder="Location (e.g., IBKR)"
            value={formData.location}
            onChange={handleLocationChange}
            className="bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
            autoComplete="off"
            style={inputStyle}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !formData.symbol || !formData.name || !formData.amount}
            className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : holdingId ? 'Update' : 'Add Holding'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
});

HoldingForm.displayName = 'HoldingForm';

export default HoldingForm;