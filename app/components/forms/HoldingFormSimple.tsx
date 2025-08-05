'use client';

import React, { useState, useCallback } from 'react';
import { type CurrencyCode } from '@/app/lib/currency';
import { HoldingFormData } from '@/app/lib/types/shared';

interface HoldingFormProps {
  categoryName: string;
  holdingId?: string;
  formData: HoldingFormData;
  onFormDataChange: (data: HoldingFormData) => void;
  onSubmit: (categoryName: string, holdingId?: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const HoldingFormSimple = ({ 
  categoryName, 
  holdingId, 
  formData, 
  onFormDataChange, 
  onSubmit, 
  onCancel, 
  loading 
}: HoldingFormProps) => {
  const [priceDetection, setPriceDetection] = useState<any>(null);

  const handleSymbolChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const symbol = e.target.value.toUpperCase();
    onFormDataChange({ ...formData, symbol });
    
    if (symbol.length >= 2) {
      try {
        const response = await fetch('/api/prices/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol })
        });
        
        if (response.ok) {
          const detection = await response.json();
          setPriceDetection(detection);
        }
      } catch (error) {
        console.error('Price detection failed:', error);
      }
    }
  }, [formData, onFormDataChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(categoryName, holdingId);
  }, [categoryName, holdingId, onSubmit]);

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-600 mb-4">
      <h4 className="text-white font-medium mb-3">
        {holdingId ? 'Edit Holding' : `Add to ${categoryName}`}
      </h4>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <input
              type="text"
              placeholder="Symbol (e.g., AAPL)"
              value={formData.symbol}
              onChange={handleSymbolChange}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
              autoComplete="off"
            />
            {priceDetection && (
              <div className="text-xs mt-1">
                {priceDetection.supportsAutoPricing ? (
                  <span className="text-green-400">
                    🟢 Auto-pricing: ${priceDetection.currentPrice?.toFixed(2)} ({priceDetection.source?.toUpperCase()})
                  </span>
                ) : (
                  <span className="text-amber-400">
                    🔄 Manual pricing required
                  </span>
                )}
              </div>
            )}
          </div>
          
          <input
            type="text"
            placeholder="Company Name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
            autoComplete="off"
          />
          
          <div>
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity || ''}
              onChange={(e) => onFormDataChange({ ...formData, quantity: Number(e.target.value) })}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
            />
          </div>
          
          <select
            value={formData.currency}
            onChange={(e) => onFormDataChange({ ...formData, currency: e.target.value as CurrencyCode })}
            className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
          >
            <option value="SGD">SGD</option>
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
          
          <input
            type="text"
            placeholder="Location (e.g., IBKR)"
            value={formData.location}
            onChange={(e) => onFormDataChange({ ...formData, location: e.target.value })}
            className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
            autoComplete="off"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !formData.symbol || !formData.name || !formData.quantity}
            className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : holdingId ? 'Update' : 'Add Holding'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default HoldingFormSimple;
