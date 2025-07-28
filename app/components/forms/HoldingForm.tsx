
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { type CurrencyCode, formatCurrency, formatNumberWithSeparators } from '@/app/lib/currency';
import { HoldingFormData } from '@/app/lib/types/shared';
import HoldingConfirmation, { ConfirmedHoldingData } from '../HoldingConfirmation';
import { PriceDetectionResult } from '../../lib/priceDetection';
import { WeightedAverageResult, calculateWeightedAverage } from '../../lib/weightedAverage';

interface HoldingFormProps {
  categoryName: string;
  holdingId?: string;
  formData: HoldingFormData;
  onFormDataChange: (data: HoldingFormData) => void;
  onSubmit: (categoryName: string, holdingId?: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const HoldingForm = React.memo(({ 
  categoryName, 
  holdingId, 
  formData, 
  onFormDataChange, 
  onSubmit, 
  onCancel, 
  loading 
}: HoldingFormProps) => {
  const [priceDetection, setPriceDetection] = useState<PriceDetectionResult | null>(null);
  const [priceDetectionLoading, setPriceDetectionLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [weightedAverage, setWeightedAverage] = useState<WeightedAverageResult | null>(null);
  const [marketPriceLoading, setMarketPriceLoading] = useState(false);
  const [marketPriceError, setMarketPriceError] = useState<string | null>(null);

  // Calculate totals in real-time
  const totalBuyValue = (formData.quantity || 0) * (formData.unitPrice || 0);
  const totalCurrentValue = (formData.quantity || 0) * (formData.currentUnitPrice || 0);
  const profitLoss = totalCurrentValue - totalBuyValue;
  const profitLossPercent = totalBuyValue > 0 ? (profitLoss / totalBuyValue) * 100 : 0;
  const showProfitLoss = formData.quantity && formData.unitPrice && formData.currentUnitPrice;

  // Auto-set manual pricing when asset type is manual
  const handleAssetTypeChange = useCallback((assetType: 'stock' | 'crypto' | 'manual') => {
    const manualPricing = assetType === 'manual';
    onFormDataChange({ ...formData, assetType, manualPricing });
  }, [formData, onFormDataChange]);

  // Event handlers - NO DEBOUNCE for immediate response
  const handleSymbolChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const symbol = e.target.value.toUpperCase();
    onFormDataChange({ ...formData, symbol });

    if (symbol.length >= 2) {
      setPriceDetectionLoading(true);
      setTimeout(async () => {
        try {
          const response = await fetch('/api/prices/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol, assetType: formData.assetType })
          });
          const detection = await response.json();
          setPriceDetection(detection);
          
          if (detection.companyName) {
            onFormDataChange({ ...formData, symbol, name: detection.companyName });
          }
        } catch (error) {
          console.error('Price detection failed:', error);
          setPriceDetection(null);
        } finally {
          setPriceDetectionLoading(false);
        }
      }, 400);
    } else {
      setPriceDetection(null);
    }
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

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = e.target.value === '' ? undefined : parseFloat(e.target.value);
    onFormDataChange({ ...formData, quantity });
  }, [formData, onFormDataChange]);

  const handleBuyPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const unitPrice = e.target.value === '' ? undefined : parseFloat(e.target.value);
    onFormDataChange({ ...formData, unitPrice });
  }, [formData, onFormDataChange]);

  const handleCurrentPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const currentUnitPrice = e.target.value === '' ? undefined : parseFloat(e.target.value);
    onFormDataChange({ ...formData, currentUnitPrice });
  }, [formData, onFormDataChange]);

  const handleGetMarketPrice = useCallback(async () => {
    if (!formData.symbol || formData.assetType === 'manual') return;
    
    setMarketPriceLoading(true);
    setMarketPriceError(null);
    
    try {
      const response = await fetch('/api/prices/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol: formData.symbol, 
          assetType: formData.assetType 
        })
      });
      
      const data = await response.json();
      if (data.currentPrice) {
        // Round to 2 decimal places for form compatibility
        const roundedPrice = Math.round(data.currentPrice * 100) / 100;
        onFormDataChange({ 
          ...formData, 
          currentUnitPrice: roundedPrice,
          unitPrice: roundedPrice // Also set unitPrice for validation
        });
      } else {
        setMarketPriceError('Unable to fetch data at this time');
      }
    } catch (error) {
      console.error('Failed to get market price:', error);
      setMarketPriceError('Unable to fetch data at this time');
    } finally {
      setMarketPriceLoading(false);
    }
  }, [formData, onFormDataChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.name || !formData.location) return;
    
    // If we have price detection and this is an "add" operation, show confirmation
    if (!holdingId && priceDetection && priceDetection.supportsAutoPricing) {
      try {
        const avgResult = await calculateWeightedAverage(
          formData.symbol,
          formData.quantity || 0,
          formData.unitPrice || 0,
          (formData.quantity || 0) * (formData.unitPrice || 0),
          formData.currency
        );
        setWeightedAverage(avgResult);
        setShowConfirmation(true);
        return;
      } catch (error) {
        console.error('Weighted average calculation failed:', error);
      }
    }
    
    onSubmit(categoryName, holdingId);
  }, [formData, holdingId, priceDetection, onSubmit, categoryName]);

  // Validation
  const hasWarnings = useMemo(() => {
    if (formData.unitPrice && formData.currentUnitPrice) {
      const priceDrop = ((formData.unitPrice - formData.currentUnitPrice) / formData.unitPrice) * 100;
      return priceDrop > 90;
    }
    return false;
  }, [formData.unitPrice, formData.currentUnitPrice]);

  const isValid = formData.symbol && 
                  formData.name && 
                  formData.quantity && 
                  formData.unitPrice && 
                  formData.location;

  if (showConfirmation && weightedAverage && priceDetection) {
    return (
      <HoldingConfirmation
        symbol={formData.symbol}
        name={formData.name}
        totalAmount={formData.quantity ? formData.quantity * (formData.unitPrice || 0) : 0}
        currency={formData.currency}
        priceDetection={priceDetection}
        weightedAverage={weightedAverage}
        onConfirm={(confirmedData) => {
          onFormDataChange({
            ...formData,
            _confirmedQuantity: confirmedData.quantity,
            _confirmedUnitPrice: confirmedData.unitPrice,
            _confirmedTotalCost: confirmedData.totalCost
          });
          
          setShowConfirmation(false);
          onSubmit(categoryName, holdingId);
        }}
        onEdit={() => setShowConfirmation(false)}
        onCancel={() => setShowConfirmation(false)}
      />
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-600 mb-4">
      <h4 className="text-white font-medium mb-4">
        {holdingId ? 'Edit Holding' : `Add to ${categoryName}`}
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Symbol and Company Name - First row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Symbol
            </label>
            <input
              type="text"
              placeholder="e.g., AAPL"
              value={formData.symbol}
              onChange={handleSymbolChange}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
              autoComplete="off"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              placeholder="e.g., Apple Inc"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
              autoComplete="off"
              disabled={loading}
            />
          </div>
        </div>

        {/* Asset Type, Quantity, Currency, and Market Price Button - Second row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Asset Type
            </label>
            <select
              value={formData.assetType || 'stock'}
              onChange={e => handleAssetTypeChange(e.target.value as 'stock' | 'crypto' | 'manual')}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm h-[44px]"
              disabled={loading}
            >
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              placeholder="Qty"
              value={formData.quantity ?? ''}
              onChange={handleQuantityChange}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm h-[44px]"
              min="0.01"
              step="0.01"
              disabled={loading}
            />
          </div>
          
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={e => handleCurrencyChange(e.target.value as CurrencyCode)}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm h-[44px]"
              disabled={loading}
            >
              <option value="SGD">🇸🇬 SGD</option>
              <option value="USD">🇺🇸 USD</option>
              <option value="INR">🇮🇳 INR</option>
            </select>
          </div>
          
          {/* Market Price Button */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Market Price
            </label>
            <button
              type="button"
              onClick={handleGetMarketPrice}
              disabled={loading || marketPriceLoading || formData.assetType === 'manual' || !formData.symbol}
              className="w-full h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
              title="Get Market Price"
            >
              {marketPriceLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="text-base">📈</span>
              )}
              <span className="hidden sm:inline">Get Price</span>
            </button>
          </div>
        </div>

        {/* Buy Price, Current Price, and Profit/Loss - Third row, compact layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Buy Price
            </label>
            <input
              type="number"
              placeholder="Buy price"
              value={formData.unitPrice ?? ''}
              onChange={handleBuyPriceChange}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm h-[44px]"
              min="0.01"
              step="0.01"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Current Price
            </label>
            <input
              type="number"
              placeholder="Current price"
              value={formData.currentUnitPrice ?? ''}
              onChange={handleCurrentPriceChange}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm h-[44px]"
              min="0.01"
              step="0.01"
              disabled={loading}
            />
            {marketPriceError && (
              <div className="text-xs text-red-400 mt-1">
                {marketPriceError}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profit/Loss
            </label>
            <div className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm h-[44px] flex items-center">
              {showProfitLoss ? (
                <span className={`${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'} text-sm`}>
                  {profitLoss >= 0 ? '+' : ''}{formatNumberWithSeparators(profitLoss)} {formData.currency}
                  <span className="text-slate-300 ml-1">
                    ({profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%)
                  </span>
                </span>
              ) : (
                <span className="text-slate-400 text-sm">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Location and Category - Fourth row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Location
            </label>
            <input
              type="text"
              placeholder="e.g., IBKR, DBS, Physical"
              value={formData.location}
              onChange={handleLocationChange}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm h-[44px]"
              autoComplete="off"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <select
              value={formData.category || categoryName}
              onChange={e => onFormDataChange({ ...formData, category: e.target.value })}
              className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm h-[44px]"
              disabled={loading}
            >
              <option value="Core">Core</option>
              <option value="Growth">Growth</option>
              <option value="Hedge">Hedge</option>
              <option value="Liquidity">Liquidity</option>
            </select>
          </div>
        </div>

        {/* Validation warnings */}
        {hasWarnings && (
          <div className="text-amber-400 text-sm p-3 bg-amber-900/20 border border-amber-600/30 rounded">
            ⚠️ Current price is more than 90% below buy price. Please verify.
          </div>
        )}

        {/* Price detection indicator */}
        {!formData.manualPricing && priceDetectionLoading && (
          <div className="text-xs text-blue-400">🔍 Checking pricing...</div>
        )}
        {!formData.manualPricing && priceDetection && !priceDetectionLoading && (
          <div className="text-xs">
            {priceDetection.supportsAutoPricing ? (
              <span className="text-green-400">
                🟢 Auto-pricing: ${priceDetection.currentPrice?.toFixed(2)} ({priceDetection.source.toUpperCase()})
              </span>
            ) : (
              <span className="text-amber-400">
                🔄 Manual pricing required
              </span>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !isValid}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px]"
          >
            {loading ? 'Saving...' : holdingId ? 'Update' : (showConfirmation ? 'Review Details' : 'Add Holding')}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px]"
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
