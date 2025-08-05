'use client';

import React, { useState, useCallback } from 'react';
import { type CurrencyCode, formatCurrency, getHoldingDisplayValue, formatCurrencyDisplay, convertCurrency } from '@/app/lib/currency';
import { formatCurrencyWithVisibility } from '@/app/lib/numberVisibility';
import { useNumberVisibility } from '@/app/lib/context/NumberVisibilityContext';
import { CategoryData, Holding, HoldingFormData } from '@/app/lib/types/shared';
import { getProgressColor, createHolding, updateHolding, deleteHolding } from '@/app/lib/portfolioCRUD';
import { getAssetIcon } from '@/app/lib/iconUtils';
import HoldingForm from './forms/HoldingForm';
import IndividualHoldingCard from './IndividualHoldingCard';

interface PortfolioCardProps {
  category: CategoryData;
  totalValue: number;
  isExpanded: boolean;
  isCompressed: boolean;
  displayCurrency: CurrencyCode;
  onToggleExpand: (categoryName: string) => void;
  onHoldingsUpdate?: () => void;
}



const PortfolioCard = React.memo(({ 
  category, 
  totalValue, 
  isExpanded, 
  isCompressed, 
  displayCurrency, 
  onToggleExpand, 
  onHoldingsUpdate 
}: PortfolioCardProps) => {
  const { numbersVisible } = useNumberVisibility();
  // Local state for form management
  const [editingHolding, setEditingHolding] = useState<string | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HoldingFormData>({
    symbol: '',
    name: '',
    currency: 'SGD',
    location: ''
  });

  // Calculate progress and target values
  const targetValue = (category.target / 100) * totalValue;
  const progressPercentage = Math.min((category.currentValue / targetValue) * 100, 100);

  // Calculate profit/loss for holdings
  const calculateHoldingProfitLoss = (holding: Holding) => {
    if (!holding.unitPrice || !holding.currentUnitPrice || !holding.quantity) {
      return { profitLoss: 0, profitLossPercent: 0, hasData: false };
    }

    const buyPrice = holding.unitPrice;
    const currentPrice = holding.currentUnitPrice;
    const quantity = holding.quantity;
    
    const profitLossOriginalCurrency = (currentPrice - buyPrice) * quantity;
    const profitLossPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
    
    // For now, assume same currency (can be enhanced with exchange rates later)
    return { 
      profitLoss: profitLossOriginalCurrency, 
      profitLossPercent, 
      hasData: true 
    };
  };

  // Event handlers
  const handleToggleExpand = useCallback(() => {
    onToggleExpand(category.name);
  }, [category.name, onToggleExpand]);

  const handleStartAdding = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ symbol: '', name: '', currency: 'SGD', location: '' });
    setAddingToCategory(true);
  }, []);

  const handleStartEditing = useCallback((holding: Holding) => {
    setFormData({
      symbol: holding.symbol,
      name: holding.name,
      currency: (holding.entryCurrency as CurrencyCode) || 'SGD',
      location: holding.location,
      assetType: holding.assetType || 'stock',
      quantity: holding.quantity ?? undefined,
      unitPrice: holding.unitPrice ?? undefined,
      currentUnitPrice: holding.currentUnitPrice ?? undefined,
      manualPricing: holding.priceSource === 'manual'
    });
    setEditingHolding(holding.id);
  }, []);

  const handleCancelForm = useCallback(() => {
    setEditingHolding(null);
    setAddingToCategory(false);
    setFormData({ symbol: '', name: '', currency: 'SGD', location: '' });
  }, []);

  const handleFormDataChange = useCallback((data: HoldingFormData) => {
    setFormData(data);
  }, []);

  const handleSubmit = useCallback(async (categoryName: string, holdingId?: string) => {
    setLoading(true);
    try {
      if (holdingId) {
        await updateHolding(holdingId, formData, categoryName);
      } else {
        await createHolding(formData, categoryName);
      }

      // Reset form and state
      setFormData({ symbol: '', name: '', currency: 'SGD', location: '' });
      setEditingHolding(null);
      setAddingToCategory(false);
      
      // Refresh holdings data and ensure proper scroll position
      if (onHoldingsUpdate) {
        onHoldingsUpdate();
        
        // Small delay to ensure DOM updates, then scroll to top of holdings
        setTimeout(() => {
          const holdingsSection = document.querySelector('.fixed-portfolio-grid');
          if (holdingsSection) {
            holdingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('Error saving holding:', error);
      alert('Failed to save holding. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, onHoldingsUpdate]);

  const handleDelete = useCallback(async (holdingId: string) => {
    if (!confirm('Are you sure you want to delete this holding?')) return;
    
    setLoading(true);
    try {
      await deleteHolding(holdingId);
      
      // Refresh holdings data
      if (onHoldingsUpdate) onHoldingsUpdate();
      
    } catch (error) {
      console.error('Error deleting holding:', error);
      alert('Failed to delete holding. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onHoldingsUpdate]);

  // Build card className
  const cardClasses = [
    'fixed-portfolio-card',
    `card-${category.name.toLowerCase()}`,
    isExpanded ? 'expanded' : '',
    isCompressed ? 'compressed' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      style={{
        overflow: isExpanded ? 'visible' : 'hidden',
        position: 'relative',
        cursor: 'pointer'
      }}
      onClick={handleToggleExpand}
    >
      {/* Header - Click to expand/collapse */}
      <div 
        className="card-header"
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
            {formatCurrencyWithVisibility(category.currentValue, displayCurrency, numbersVisible, { compact: true, precision: 0 })}
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
      </div>

      {/* Holdings Preview (when collapsed) */}
      {!isExpanded && (
        <div className="holdings-preview">
          {category.holdings.slice(0, 3).map((holding, index) => {
            const { profitLoss, profitLossPercent, hasData } = calculateHoldingProfitLoss(holding);
            return (
              <div key={holding.id || index} className="holding-item">
                <span>
                  {getAssetIcon(holding.symbol, holding.name)} {holding.symbol}
                  {holding.priceSource !== 'manual' && (
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1 align-middle ${
                      holding.priceUpdated && (new Date().getTime() - new Date(holding.priceUpdated).getTime() < 24 * 60 * 60 * 1000)
                        ? 'bg-green-400'
                        : 'bg-green-950'
                    }`} style={{ boxShadow: '0 0 0 1px #222' }} title={
                      holding.priceUpdated && (new Date().getTime() - new Date(holding.priceUpdated).getTime() < 24 * 60 * 60 * 1000)
                        ? 'Auto-updated in last 24h'
                        : 'Auto-updated (not in last 24h)'
                    }></span>
                  )}
                </span>
                <div className="flex flex-col items-end">
                  <span>{numbersVisible ? formatCurrencyDisplay(holding, displayCurrency) : '••••••'}</span>
                  {hasData && (
                    <span className={`text-xs ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(0)} ({profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
          {addingToCategory && (
            <div onClick={e => e.stopPropagation()}>
            <HoldingForm 
              key={`add-${category.name}`}
              categoryName={category.name}
              formData={formData}
              onFormDataChange={handleFormDataChange}
              onSubmit={handleSubmit}
              onCancel={handleCancelForm}
              loading={loading}
            />
            </div>
          )}

          {/* Compact Header with Add Button */}
          <div className="flex items-center justify-between mb-3">
            <h4 style={{ color: '#34d399', margin: 0, fontSize: '0.875rem' }}>
              Holdings ({category.holdings.length})
            </h4>
            {!addingToCategory && (
              <button
                onClick={handleStartAdding}
                className="bg-transparent border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-gray-900 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-md"
              >
                Add Holdings
              </button>
            )}
          </div>
          
          <div className="all-holdings">
            {category.holdings.map((holding) => (
              <div key={holding.id}>
                {editingHolding === holding.id ? (
                  <div onClick={e => e.stopPropagation()}>
                  <HoldingForm 
                    key={`edit-${holding.id}`}
                    categoryName={category.name}
                    holdingId={holding.id}
                    formData={formData}
                    onFormDataChange={handleFormDataChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancelForm}
                    loading={loading}
                  />
                  </div>
                ) : (
                  <IndividualHoldingCard
                    holding={holding}
                    categoryCurrentValue={category.currentValue}
                    displayCurrency={displayCurrency}
                    loading={loading}
                    onEdit={handleStartEditing}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

PortfolioCard.displayName = 'PortfolioCard';

export default PortfolioCard;