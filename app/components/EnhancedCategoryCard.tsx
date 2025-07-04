'use client';

import { useCallback, useMemo } from 'react';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  value: number;
  category: string;
  location: string;
}

interface EnhancedCategoryCardProps {
  category: {
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
    id: string; // Make sure this exists
  };
  totalValue: number;
  isExpanded: boolean;
  onToggleExpand: (categoryName: string) => void;
}

const EnhancedCategoryCard: React.FC<EnhancedCategoryCardProps> = ({ 
  category, 
  totalValue, 
  isExpanded, 
  onToggleExpand 
}) => {
  // Memoize expensive calculations to prevent unnecessary re-renders
  const progressData = useMemo(() => {
    const targetValue = (category.target / 100) * totalValue;
    const progressPercentage = Math.min((category.currentValue / targetValue) * 100, 100);
    const excessPercentage = Math.max(((category.currentValue - targetValue) / targetValue) * 100, 0);
    
    return { targetValue, progressPercentage, excessPercentage };
  }, [category.currentValue, category.target, totalValue]);

  const getAssetIcon = useCallback((symbol: string) => {
    const icons: { [key: string]: string } = {
      'NVDA': '🇺🇸', 'GOOG': '🇺🇸', 'TSLA': '🇺🇸', 'IREN': '🇺🇸',
      'VUAA': '🇺🇸', 'INDIA': '🇮🇳', 'SGD': '🇸🇬', 'USDC': '💵', 
      'BTC': '₿', 'WBTC': '₿', 'GOLD': '🥇', 'HIMS': '🇺🇸', 'UNH': '🇺🇸',
      'AAPL': '🇺🇸', 'AMGN': '🇺🇸', 'CRM': '🇺🇸', 'ETH': '⟠'
    };
    return icons[symbol] || '📊';
  }, []);

  const getStatusColorClasses = useCallback((status: string) => {
    switch (status) {
      case 'perfect': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'underweight': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'excess': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  }, []);

  const getProgressColor = useCallback((status: string) => {
    switch (status) {
      case 'perfect': return '#10b981';
      case 'underweight': return '#f59e0b';
      case 'excess': return '#ef4444';
      default: return '#64748b';
    }
  }, []);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Enhanced card clicked:', category.name, 'Current expanded:', isExpanded);
    onToggleExpand(category.name);
  }, [category.name, onToggleExpand, isExpanded]);

  return (
      <div
          className={`
            bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 
            transition-all duration-300 cursor-pointer group portfolio-card-enhanced
            hover:bg-slate-800/80 hover:border-slate-600/60 hover:shadow-2xl
            ${isExpanded
                ? 'ring-2 ring-blue-500/20 shadow-2xl expanded'
                : 'hover:scale-[1.01]'
              }
            `}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleExpand(category.name);
        }
      }}
    >
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: category.color }}
          >
            {category.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              {category.name}
            </h3>
            <p className="text-xs text-slate-400">{category.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              ${(category.currentValue / 1000).toFixed(0)}k
            </div>
            <div className="text-sm text-slate-400">
              {category.currentPercent.toFixed(1)}%
            </div>
          </div>
          
          {/* Expand/Collapse Icon */}
            <div className="text-blue-400 transition-transform duration-300 text-lg font-bold">
                {isExpanded ? '▲' : '▼'}
            </div>
        </div>
      </div>

      {/* Target vs Current */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Current: ${(category.currentValue / 1000).toFixed(0)}k</span>
          <span>Target: ${(progressData.targetValue / 1000).toFixed(0)}k</span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${progressData.progressPercentage}%`,
                backgroundColor: getProgressColor(category.status)
              }}
            />
          </div>
          
          {/* Overallocation indicator */}
          {progressData.excessPercentage > 0 && (
            <div className="w-full h-1 bg-red-500/20 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressData.excessPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-slate-500">
            {progressData.progressPercentage.toFixed(1)}% allocated
          </span>
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColorClasses(category.status)}`}>
            {category.statusText}
          </span>
        </div>
      </div>

      {/* Holdings Preview - Always Visible (3 items max) */}
      <div className="space-y-2 mb-4">
        {category.holdings.slice(0, 3).map((holding, index) => (
          <div key={holding.id || index} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span>{getAssetIcon(holding.symbol)}</span>
              <span className="font-medium text-white">{holding.symbol}</span>
              <span className="text-slate-500 text-xs">({holding.location})</span>
            </div>
            <span className="text-slate-300">${(holding.value / 1000).toFixed(0)}k</span>
          </div>
        ))}
        
        {category.holdings.length > 3 && !isExpanded && (
          <div className="text-center">
            <span className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              +{category.holdings.length - 3} more holdings (click to expand)
            </span>
          </div>
        )}
      </div>

      {/* Expanded Content - Animated with proper height calculation */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isExpanded 
            ? 'max-h-[500px] opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
        style={{
          // Use CSS custom property for smooth animation
          '--expanded-height': isExpanded ? 'auto' : '0'
        }}
      >
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-slate-700/50">
            {/* All Holdings */}
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span>All Holdings</span>
                <span className="text-xs text-slate-400">({category.holdings.length})</span>
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                {category.holdings.map((holding, index) => (
                  <div key={holding.id || index} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getAssetIcon(holding.symbol)}</span>
                      <div>
                        <div className="font-medium text-white">{holding.symbol}</div>
                        <div className="text-xs text-slate-400">{holding.location}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">
                        ${(holding.value / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-slate-400">
                        {((holding.value / category.currentValue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Recommendations */}
            <div className="p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
              <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                <span>💡</span>
                Recommended Actions
              </h5>
              {category.status === 'perfect' && (
                <p className="text-sm text-emerald-400">
                  ✅ Allocation is optimal. Hold steady and continue regular contributions.
                </p>
              )}
              {category.status === 'underweight' && (
                <div className="text-sm space-y-1">
                  <p className="text-amber-400">
                    ⚠️ Add ${Math.abs(category.gapAmount / 1000).toFixed(0)}k to reach target
                  </p>
                  <p className="text-slate-400">Consider: DCA into {category.name.toLowerCase()} positions over next 2-3 months</p>
                </div>
              )}
              {category.status === 'excess' && (
                <div className="text-sm space-y-1">
                  <p className="text-red-400">
                    🔴 Trim ${Math.abs(category.gapAmount / 1000).toFixed(0)}k excess
                  </p>
                  <p className="text-slate-400">Consider: Gradual rebalancing into underweight categories</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCategoryCard;