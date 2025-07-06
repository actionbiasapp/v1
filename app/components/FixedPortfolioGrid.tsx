'use client';

import { useCallback } from 'react';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  value: number;
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
}

export default function FixedPortfolioGrid({
  categories,
  totalValue,
  expandedCards,
  onToggleExpand
}: FixedPortfolioGridProps) {
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

  const getExpandedCardName = () => {
    return expandedCards.size > 0 ? Array.from(expandedCards)[0] : null;
  };

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
            onClick={() => onToggleExpand(category.name)}
          >
            {/* Header */}
            <div className="card-header">
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
                <div className="card-value">${(category.currentValue / 1000).toFixed(0)}k</div>
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

            {/* Holdings Preview */}
            <div className="holdings-preview">
              {category.holdings.slice(0, isExpanded ? 0 : 3).map((holding, index) => (
                <div key={holding.id || index} className="holding-item">
                  <span>{getAssetIcon(holding.symbol)} {holding.symbol}</span>
                  <span>${(holding.value / 1000).toFixed(0)}k</span>
                </div>
              ))}
              {category.holdings.length > 3 && !isExpanded && (
                <div style={{ textAlign: 'center', color: '#60a5fa', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  +{category.holdings.length - 3} more holdings
                </div>
              )}
            </div>

            {/* Expanded Content */}
            <div className="expanded-content">
              <h4 style={{ color: '#34d399', marginBottom: '1rem' }}>All Holdings ({category.holdings.length})</h4>
              <div className="all-holdings">
                {category.holdings.map((holding, index) => (
                  <div key={holding.id || index} className="detailed-holding">
                    <span>{getAssetIcon(holding.symbol)} {holding.symbol} ({holding.location})</span>
                    <span>${(holding.value / 1000).toFixed(0)}k ({((holding.value / category.currentValue) * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
              <div className="recommendations">
                <div className="recommendations-title">💡 Recommended Actions</div>
                {category.status === 'perfect' && (
                  <div style={{ color: '#86efac', fontSize: '0.85rem' }}>✅ Allocation is optimal. Hold steady and continue regular contributions.</div>
                )}
                {category.status === 'underweight' && (
                  <div>
                    <div style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '0.5rem' }}>⚠️ Add ${Math.abs(category.gapAmount / 1000).toFixed(0)}k to reach target</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Consider: DCA into {category.name.toLowerCase()} positions over next 2-3 months</div>
                  </div>
                )}
                {category.status === 'excess' && (
                  <div>
                    <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '0.5rem' }}>🔴 Trim ${Math.abs(category.gapAmount / 1000).toFixed(0)}k excess</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Consider: Gradual rebalancing into underweight categories</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}