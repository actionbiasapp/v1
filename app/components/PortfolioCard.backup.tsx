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
      location: holding.location
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
      
      // Refresh holdings data
      if (onHoldingsUpdate) onHoldingsUpdate();
      
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
        position: 'relative'
      }}
    >
      {/* Header - Click to expand/collapse */}
      <div 
        className="card-header"
        onClick={handleToggleExpand}
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
          {addingToCategory && (
            <HoldingForm 
              key={`add-${category.name}`}
              categoryName={category.name}
              formData={formData}
              onFormDataChange={handleFormDataChange}
              onSubmit={handleSubmit}
              onCancel={handleCancelForm}
              loading={loading}
            />
          )}

          {/* Add Holding Button */}
          {!addingToCategory && (
            <button
              onClick={handleStartAdding}
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
              <div key={holding.id}>
                {editingHolding === holding.id ? (
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
});

PortfolioCard.displayName = 'PortfolioCard';

export default PortfolioCard;