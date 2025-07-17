'use client';

import React, { useCallback } from 'react';
import { type CurrencyCode, formatCurrency, getHoldingDisplayValue } from '@/app/lib/currency';
import { Holding } from '@/app/lib/types/shared';

interface IndividualHoldingCardProps {
  holding: Holding;
  categoryCurrentValue: number;
  displayCurrency: CurrencyCode;
  loading: boolean;
  onEdit: (holding: Holding) => void;
  onDelete: (holdingId: string) => void;
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

const IndividualHoldingCard = React.memo(({ 
  holding, 
  categoryCurrentValue, 
  displayCurrency, 
  loading, 
  onEdit, 
  onDelete 
}: IndividualHoldingCardProps) => {
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(holding);
  }, [holding, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(holding.id);
  }, [holding.id, onDelete]);

  const displayValue = getHoldingDisplayValue(holding, displayCurrency);
  const percentageOfCategory = ((displayValue / categoryCurrentValue) * 100).toFixed(1);

  return (
    <div className="detailed-holding">
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
              {formatCurrency(displayValue, displayCurrency, { compact: true })}
            </div>
            <div className="text-xs text-slate-400">
              {percentageOfCategory}%
            </div>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={handleEdit}
              className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-600 hover:bg-blue-600/20"
              disabled={loading}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-600 hover:bg-red-600/20"
              disabled={loading}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

IndividualHoldingCard.displayName = 'IndividualHoldingCard';

export default IndividualHoldingCard;