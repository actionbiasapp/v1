'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { type CurrencyCode, formatCurrency, getHoldingDisplayValue } from '@/app/lib/currency';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  value: number;           // Backward compatibility (SGD)
  valueSGD: number;        // ✅ FIXED: Required multi-currency values
  valueINR: number;        // ✅ FIXED: Required
  valueUSD: number;        // ✅ FIXED: Required
  entryCurrency: string;
  category: string;
  location: string;
}

interface CategoryData {
  name: string;
  holdings: Holding[];
  currentValue: number;
  currentPercent: number;
  target: number;
  gap: number;
  gapAmount: number;
  color: string;
  icon: React.ReactNode;
  description: string;
  status: 'perfect' | 'underweight' | 'excess';
  statusText: string;
  id: string;
}

interface FixedPortfolioGridProps {
  categories: CategoryData[];
  totalValue: number;
  expandedCards: Set<string>;
  onToggleExpand: (categoryName: string) => void;
  displayCurrency: CurrencyCode;
  onHoldingsUpdate?: () => void; // Callback to refresh holdings data
}

interface HoldingFormData {
  symbol: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  location: string;
}

// ✅ CRITICAL FIX: Move CurrencySelector outside render function
const CurrencySelector = React.memo(({ value, onChange, amount, onAmountChange }: {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  amount: number;
  onAmountChange: (amount: number) => void;
}) => {
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

// ✅ CRITICAL FIX: Move HoldingForm outside render function
const HoldingForm = React.memo(({ 
  categoryName, 
  holdingId, 
  formData, 
  onFormDataChange, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  categoryName: string; 
  holdingId?: string;
  formData: HoldingFormData;
  onFormDataChange: (data: HoldingFormData) => void;
  onSubmit: (categoryName: string, holdingId?: string) => void;
  onCancel: () => void;
  loading: boolean;
}) => {
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

export default function FixedPortfolioGrid({
  categories,
  totalValue,
  expandedCards,
  onToggleExpand,
  displayCurrency,
  onHoldingsUpdate
}: FixedPortfolioGridProps) {
  const [editingHolding, setEditingHolding] = useState<string | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HoldingFormData>({
    symbol: '',
    name: '',
    amount: 0,
    currency: 'SGD',
    location: ''
  });

  const getAssetIcon = useCallback((symbol: string) => {
    const icons: { [key: string]: string } = {
      'NVDA': '🇺🇸', 'GOOG': '🇺🇸', 'TSLA': '🇺🇸', 'IREN': '🇺🇸',
      'VUAA': '🇺🇸', 'INDIA': '🇮🇳', 'SGD': '🇸🇬', 'USDC': '💵',
      'BTC': '₿', 'WBTC': '₿', 'GOLD': '🥇', 'HIMS': '🇺🇸', 'UNH': '🇺🇸',
      'AAPL': '🇺🇸', 'AMGN': '🇺🇸', 'CRM': '🇺🇸', 'ETH': '⟠'
    };
    return icons[symbol] || '📊';
  }, []);

  const getProgressColor = useCallback((status: string) => {
    switch (status) {
      case 'perfect': return '#10b981';
      case 'underweight': return '#f59e0b';
      case 'excess': return '#ef4444';
      default: return '#64748b';
    }
  }, []);

  // Currency conversion helper
  const convertToAllCurrencies = useCallback(async (amount: number, fromCurrency: CurrencyCode) => {
    try {
      const response = await fetch('/api/exchange-rates/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, fromCurrency, toCurrency: 'ALL' })
      });
      
      if (!response.ok) throw new Error('Conversion failed');
      const data = await response.json();
      
      return {
        SGD: data.SGD,
        USD: data.USD,
        INR: data.INR
      };
    } catch (error) {
      console.error('Currency conversion error:', error);
      // Fallback conversion rates (approximate)
      const rates = { SGD: 1, USD: 0.74, INR: 63.5 };
      const sgdAmount = amount * (rates.SGD / rates[fromCurrency]);
      return {
        SGD: sgdAmount,
        USD: sgdAmount * rates.USD,
        INR: sgdAmount * rates.INR
      };
    }
  }, []);

  // Handle form submission for add/edit
  const handleSubmit = useCallback(async (categoryName: string, holdingId?: string) => {
    setLoading(true);
    try {
      // Convert amount to all currencies
      const convertedValues = await convertToAllCurrencies(formData.amount, formData.currency);
      
      const holdingData = {
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        valueSGD: convertedValues.SGD,
        valueINR: convertedValues.INR,
        valueUSD: convertedValues.USD,
        value: convertedValues.SGD, // Backward compatibility
        entryCurrency: formData.currency,
        category: categoryName,
        location: formData.location
      };

      let response;
      if (holdingId) {
        // Update existing holding
        response = await fetch(`/api/holdings/${holdingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(holdingData)
        });
      } else {
        // Create new holding
        response = await fetch('/api/holdings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(holdingData)
        });
      }

      if (!response.ok) throw new Error('API request failed');

      // Reset form and state
      setFormData({ symbol: '', name: '', amount: 0, currency: 'SGD', location: '' });
      setEditingHolding(null);
      setAddingToCategory(null);
      
      // Refresh holdings data
      if (onHoldingsUpdate) onHoldingsUpdate();
      
    } catch (error) {
      console.error('Error saving holding:', error);
      alert('Failed to save holding. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, convertToAllCurrencies, onHoldingsUpdate]);

  // Handle delete holding
  const handleDelete = useCallback(async (holdingId: string) => {
    if (!confirm('Are you sure you want to delete this holding?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/holdings/${holdingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');

      // Refresh holdings data
      if (onHoldingsUpdate) onHoldingsUpdate();
      
    } catch (error) {
      console.error('Error deleting holding:', error);
      alert('Failed to delete holding. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onHoldingsUpdate]);

  // Start editing a holding
  const startEditing = useCallback((holding: Holding) => {
    setFormData({
      symbol: holding.symbol,
      name: holding.name,
      amount: getHoldingDisplayValue(holding, holding.entryCurrency as CurrencyCode || 'SGD'),
      currency: (holding.entryCurrency as CurrencyCode) || 'SGD',
      location: holding.location
    });
    setEditingHolding(holding.id);
  }, []);

  // Start adding to category
  const startAddingToCategory = useCallback((categoryName: string) => {
    setFormData({ symbol: '', name: '', amount: 0, currency: 'SGD', location: '' });
    setAddingToCategory(categoryName);
  }, []);

  // Cancel editing/adding
  const cancelForm = useCallback(() => {
    setEditingHolding(null);
    setAddingToCategory(null);
    setFormData({ symbol: '', name: '', amount: 0, currency: 'SGD', location: '' });
  }, []);

  // Stable form data change handler
  const handleFormDataChange = useCallback((data: HoldingFormData) => {
    setFormData(data);
  }, []);

  const getExpandedCardName = useCallback(() => {
    return expandedCards.size > 0 ? Array.from(expandedCards)[0] : null;
  }, [expandedCards]);

  // Build className properly
  const expandedCardName = getExpandedCardName();
  const gridClassName = expandedCardName 
    ? `fixed-portfolio-grid grid-${expandedCardName.toLowerCase()}-expanded`
    : 'fixed-portfolio-grid';

  return (
    <div className={gridClassName}>
      {categories.map((category) => {
        const isExpanded = expandedCards.has(category.name);
        const isCompressed = expandedCards.size > 0 && !isExpanded;
        const targetValue = (category.target / 100) * totalValue;
        const progressPercentage = Math.min((category.currentValue / targetValue) * 100, 100);

        // Build card className
        const cardClasses = [
          'fixed-portfolio-card',
          `card-${category.name.toLowerCase()}`,
          isExpanded ? 'expanded' : '',
          isCompressed ? 'compressed' : ''
        ].filter(Boolean).join(' ');

        return (
          <div
            key={category.name}
            className={cardClasses}
            style={{
              overflow: isExpanded ? 'visible' : 'hidden',
              position: 'relative'
            }}
          >
            {/* Header - Click to expand/collapse */}
            <div 
              className="card-header"
              onClick={() => onToggleExpand(category.name)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div 
                  className="card-icon"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>
                <div className="card-title-info">
                  <div className="card-title">{category.name}</div>
                  <div className="card-description">{category.description}</div>
                </div>
              </div>
              <div>
                <div className="card-value">
                  {formatCurrency(category.currentValue, displayCurrency, { compact: true })}
                </div>
                <span className="expand-indicator">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="progress-section">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ 
                    width: `${progressPercentage}%`,
                    backgroundColor: getProgressColor(category.status)
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                <span>{progressPercentage.toFixed(1)}% allocated</span>
                <span className={`status-badge status-${category.status}`}>
                  {category.statusText}
                </span>
              </div>
            </div>

            {/* Holdings Preview (when collapsed) */}
            {!isExpanded && (
              <div className="holdings-preview">
                {category.holdings.slice(0, 3).map((holding, index) => (
                  <div key={holding.id || index} className="holding-item">
                    <span>{getAssetIcon(holding.symbol)} {holding.symbol}</span>
                    <span>{formatCurrency(getHoldingDisplayValue(holding, displayCurrency), displayCurrency, { compact: true })}</span>
                  </div>
                ))}
                {category.holdings.length > 3 && (
                  <div style={{ textAlign: 'center', color: '#60a5fa', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    +{category.holdings.length - 3} more holdings
                  </div>
                )}
              </div>
            )}

            {/* Expanded Content */}
            {isExpanded && (
              <div className="expanded-content">
                {/* Add Holding Form */}
                {addingToCategory === category.name && (
                  <HoldingForm 
                    key={`add-${category.name}`}
                    categoryName={category.name}
                    formData={formData}
                    onFormDataChange={handleFormDataChange}
                    onSubmit={handleSubmit}
                    onCancel={cancelForm}
                    loading={loading}
                  />
                )}

                {/* Add Holding Button */}
                {addingToCategory !== category.name && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startAddingToCategory(category.name);
                    }}
                    className="w-full bg-emerald-600 text-white py-2 px-4 rounded mb-4 text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    + Add Holding to {category.name}
                  </button>
                )}

                <h4 style={{ color: '#34d399', marginBottom: '1rem' }}>
                  All Holdings ({category.holdings.length})
                </h4>
                
                <div className="all-holdings">
                  {category.holdings.map((holding) => (
                    <div key={holding.id} className="detailed-holding">
                      {editingHolding === holding.id ? (
                        <HoldingForm 
                          key={`edit-${holding.id}`}
                          categoryName={category.name}
                          holdingId={holding.id}
                          formData={formData}
                          onFormDataChange={handleFormDataChange}
                          onSubmit={handleSubmit}
                          onCancel={cancelForm}
                          loading={loading}
                        />
                      ) : (
                        <div className="flex justify-between items-center w-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span>{getAssetIcon(holding.symbol)} {holding.symbol}</span>
                              <span className="text-slate-400 text-xs">({holding.location})</span>
                            </div>
                            <div className="text-slate-400 text-xs">{holding.name}</div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-white">
                                {formatCurrency(getHoldingDisplayValue(holding, displayCurrency), displayCurrency, { compact: true })}
                              </div>
                              <div className="text-xs text-slate-400">
                                {((getHoldingDisplayValue(holding, displayCurrency) / category.currentValue) * 100).toFixed(1)}%
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(holding);
                                }}
                                className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-600 hover:bg-blue-600/20"
                                disabled={loading}
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(holding.id);
                                }}
                                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-600 hover:bg-red-600/20"
                                disabled={loading}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="recommendations">
                  <div className="recommendations-title">💡 Recommended Actions</div>
                  {category.status === 'perfect' && (
                    <div style={{ color: '#86efac', fontSize: '0.85rem' }}>
                      ✅ Allocation is optimal. Hold steady and continue regular contributions.
                    </div>
                  )}
                  {category.status === 'underweight' && (
                    <div>
                      <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        ⚠️ Add {formatCurrency(Math.abs(category.gapAmount), displayCurrency, { compact: true })} to reach target
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                        Consider: DCA into {category.name.toLowerCase()} positions over next 2-3 months
                      </div>
                    </div>
                  )}
                  {category.status === 'excess' && (
                    <div>
                      <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        🔴 Trim {formatCurrency(Math.abs(category.gapAmount), displayCurrency, { compact: true })} excess
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                        Consider: Gradual rebalancing into underweight categories
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}