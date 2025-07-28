'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { type CurrencyCode, formatCurrency, getHoldingDisplayValue, convertCurrency, formatCurrencyDisplay } from '@/app/lib/currency';
import { Holding } from '@/app/lib/types/shared';
import ActionButtons from './ui/ActionButtons';

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

function formatK(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  if (value >= 1000 || value <= -1000) {
    const rounded = Math.round(value / 100) / 10;
    return `${rounded % 1 === 0 ? Math.round(rounded) : rounded}k`;
  }
  return Math.round(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

const IndividualHoldingCard = React.memo(({ 
  holding, 
  categoryCurrentValue, 
  displayCurrency, 
  loading, 
  onEdit, 
  onDelete 
}: IndividualHoldingCardProps) => {
  
  const handleEdit = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onEdit(holding);
  }, [holding, onEdit]);

  const handleDelete = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onDelete(holding.id);
  }, [holding.id, onDelete]);

  const displayValue = getHoldingDisplayValue(holding, displayCurrency);
  const percentageOfCategory = ((displayValue / categoryCurrentValue) * 100).toFixed(1);

  const [usdToSgd, setUsdToSgd] = useState<number>(1.35);
  const [exchangeRates, setExchangeRates] = useState<any>(null);
  
  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch('/api/exchange-rates');
        if (res.ok) {
          const data = await res.json();
          if (data.rates && data.rates.USD_TO_SGD) {
            setUsdToSgd(Number(data.rates.USD_TO_SGD));
            setExchangeRates(data.rates);
          }
        }
      } catch {}
    }
    fetchRate();
  }, []);

  // Calculate display value: always use currentPrice × quantity when available
  let mainDisplayValue = displayValue;
  if (holding.quantity && holding.currentUnitPrice) {
    const quantity = holding.quantity;
    const currentPrice = holding.currentUnitPrice;
    const entryCurrency = holding.entryCurrency as CurrencyCode;
    
    // Calculate the total value in the entry currency
    const totalValueInEntryCurrency = quantity * currentPrice;
    
    // Convert to display currency if needed
    if (entryCurrency === displayCurrency) {
      // Same currency, no conversion needed
      mainDisplayValue = totalValueInEntryCurrency;
    } else if (exchangeRates) {
      // Convert from entry currency to display currency
      try {
        mainDisplayValue = convertCurrency(
          totalValueInEntryCurrency,
          entryCurrency,
          displayCurrency,
          exchangeRates
        );
      } catch (error) {
        console.error('Currency conversion error:', error);
        // Fallback to entry currency value
        mainDisplayValue = totalValueInEntryCurrency;
      }
    } else {
      // No exchange rates available, use entry currency value
      mainDisplayValue = totalValueInEntryCurrency;
    }
  }
  // Round main value to nearest k, no decimals
  const mainDisplayK = formatK(mainDisplayValue);

  // Calculate profit/loss
  const calculateProfitLoss = () => {
    // Need both unit prices and quantity to calculate profit/loss
    if (!holding.unitPrice || !holding.currentUnitPrice || !holding.quantity || !exchangeRates) {
      return { profitLoss: 0, profitLossPercent: 0, hasData: false };
    }

    // Calculate profit/loss in the original currency first
    const buyPrice = holding.unitPrice;
    const currentPrice = holding.currentUnitPrice;
    const quantity = holding.quantity;
    
    // Calculate profit/loss in original currency
    const profitLossOriginalCurrency = (currentPrice - buyPrice) * quantity;
    const profitLossPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
    
    // Convert profit/loss to display currency using proper conversion
    let profitLossInDisplayCurrency = profitLossOriginalCurrency;
    
    if (holding.entryCurrency !== displayCurrency) {
      try {
        profitLossInDisplayCurrency = convertCurrency(
          profitLossOriginalCurrency,
          holding.entryCurrency as CurrencyCode,
          displayCurrency,
          exchangeRates
        );
      } catch (error) {
        console.error('Currency conversion error:', error);
        // Fallback to original currency if conversion fails
        profitLossInDisplayCurrency = profitLossOriginalCurrency;
      }
    }
    
    return { 
      profitLoss: profitLossInDisplayCurrency, 
      profitLossPercent, 
      hasData: true 
    };
  };

  const { profitLoss, profitLossPercent, hasData } = calculateProfitLoss();

  return (
    <div className="detailed-holding" onClick={handleEdit}>
      <div className="flex justify-between items-start w-full gap-4">
        <div className="flex-1 min-w-0">
          {/* Header with symbol and status */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1 leading-none">
              <span className="font-medium text-white text-sm leading-none align-middle">
                {getAssetIcon(holding.symbol)} {holding.symbol}
              </span>
              {holding.quantity && (
                <span className="text-slate-300 text-sm font-medium leading-none align-middle">
                  ({holding.quantity})
                </span>
              )}
            </div>
            {holding.priceSource !== 'manual' && (
              <span className={`inline-block w-1 h-1 rounded-full align-middle ${
                holding.priceUpdated && (new Date().getTime() - new Date(holding.priceUpdated).getTime() < 24 * 60 * 60 * 1000)
                  ? 'bg-green-400' // bright green
                  : 'bg-green-950' // much darker green for dull
              }`} style={{ boxShadow: '0 0 0 1px #222' }} title={
                holding.priceUpdated && (new Date().getTime() - new Date(holding.priceUpdated).getTime() < 24 * 60 * 60 * 1000)
                  ? 'Auto-updated in last 24h'
                  : 'Auto-updated (not in last 24h)'
              }></span>
            )}
            <span className="text-slate-400 text-xs">({holding.location})</span>
          </div>
          
          {/* Company name */}
          <div className="text-slate-300 text-xs mb-1.5">{holding.name}</div>
          
          {/* Price information - hidden on mobile, compact on desktop */}
          <div className="hidden md:block">
            {holding.unitPrice !== undefined && holding.currentUnitPrice !== undefined && (
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Buy:</span>
                  <span className="text-white font-medium">{formatK(holding.unitPrice)} {holding.entryCurrency || 'SGD'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Current:</span>
                  <span className="text-white font-medium">{formatK(holding.currentUnitPrice)} {holding.entryCurrency || 'SGD'}</span>
                </div>
                {hasData && (
                  <div className={`flex items-center gap-1 ${
                    profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span>{profitLoss >= 0 ? '+' : ''}{formatK(profitLoss)} {displayCurrency}</span>
                    <span>({profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - values and actions */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="text-right">
            <div className="text-white font-medium text-xs">
              {formatCurrencyDisplay(holding, displayCurrency, exchangeRates)}
            </div>
            <div className="text-slate-400 text-xs">
              {percentageOfCategory}%
            </div>
          </div>
          
          <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
            <ActionButtons
              onEdit={handleEdit}
              onDelete={handleDelete}
              size="sm"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

IndividualHoldingCard.displayName = 'IndividualHoldingCard';

export default IndividualHoldingCard;