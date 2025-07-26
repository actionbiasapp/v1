'use client';

import React, { useState, useCallback } from 'react';
import { type CurrencyCode, formatCurrency, getHoldingDisplayValue } from '@/app/lib/currency';
import { CategoryData, Holding, HoldingFormData } from '@/app/lib/types/shared';
import { getProgressColor, createHolding, updateHolding, deleteHolding } from '@/app/lib/portfolioCRUD';
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

// Asset icon helper - moved from main component
const getAssetIcon = (symbol: string): string => {
  const icons: { [key: string]: string } = {
    'NVDA': '🇺🇸', 'GOOG': '🇺🇸', 'TSLA': '🇺🇸', 'IREN': '🇺🇸',
    'VUAA': '🇺🇸', 'INDIA': '🇮🇳', 'SGD': '🇸🇬', 'USDC': '💵',
    'BTC': '₿', 'WBTC': '₿', 'GOLD': '🥇', 'HIMS': '🇺🇸', 'UNH': '🇺🇸',
    'AAPL': '🇺🇸', 'AMGN': '🇺🇸', 'CRM': '🇺🇸', 'ETH': '⟠'
  };
  return icons[symbol] || '📊';
};

const PortfolioCard = React.memo(({ 
  category, 
  totalValue, 
  isExpanded, 
  isCompressed, 
  displayCurrency, 
  onToggleExpand, 
  onHoldingsUpdate 
}: PortfolioCardProps) => {
  // Local state for form management
  const [editingHolding, setEditingHolding] = useState<string | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HoldingFormData>({
    symbol: '',
    name: '',
    amount: 0,
    currency: 'SGD',
    location: ''
  });

  // Calculate progress and target values
  const targetValue = (category.target / 100) * totalValue;
  const progressPercentage = Math.min((category.currentValue / targetValue) * 100, 100);

  // Event handlers
  const handleToggleExpand = useCallback(() => {
    onToggleExpand(category.name);
  }, [category.name, onToggleExpand]);

  const handleStartAdding = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ symbol: '', name: '', amount: 0, currency: 'SGD', location: '' });
    setAddingToCategory(true);
  }, []);

  const handleStartEditing = useCallback((holding: Holding) => {
    setFormData({
      symbol: holding.symbol,
      name: holding.name,
      amount: getHoldingDisplayValue(holding, holding.entryCurrency as CurrencyCode || 'SGD'),
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
    setFormData({ symbol: '', name: '', amount: 0, currency: 'SGD', location: '' });
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
      setFormData({ symbol: '', name: '', amount: 0, currency: 'SGD', location: '' });
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
            {formatCurrency(category.currentValue, displayCurrency, { compact: true, precision: 0 })}
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
          {category.holdings.slice(0, 3).map((holding, index) => (
            <div key={holding.id || index} className="holding-item">
              <span>
                {getAssetIcon(holding.symbol)} {holding.symbol}
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
              <span>{formatCurrency(getHoldingDisplayValue(holding, displayCurrency), displayCurrency, { compact: true, precision: 0 })}</span>
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
                className="bg-emerald-600 text-white py-0.5 px-2 rounded text-xs font-medium hover:bg-emerald-700 transition-colors"
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