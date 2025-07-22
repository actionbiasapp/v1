'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { type CurrencyCode, formatCurrency, getHoldingDisplayValue, convertCurrency } from '@/app/lib/currency';
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
      <div className="flex justify-between items-center w-full">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span>
              {getAssetIcon(holding.symbol)} {holding.symbol}
              {holding.quantity ? ` (${holding.quantity})` : ''}
              {holding.priceSource !== 'manual' && (
                <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1 align-middle ${
                  holding.priceUpdated && (new Date().getTime() - new Date(holding.priceUpdated).getTime() < 24 * 60 * 60 * 1000)
                    ? 'bg-green-400' // bright green
                    : 'bg-green-950' // much darker green for dull
                }`} style={{ boxShadow: '0 0 0 1px #222' }} title={
                  holding.priceUpdated && (new Date().getTime() - new Date(holding.priceUpdated).getTime() < 24 * 60 * 60 * 1000)
                    ? 'Auto-updated in last 24h'
                    : 'Auto-updated (not in last 24h)'
                }></span>
              )}
            </span>
            <span className="text-slate-400 text-xs">({holding.location})</span>
          </div>
          <div className="text-slate-400 text-xs">{holding.name}</div>
          <div className="flex flex-col gap-1 mt-1">
            {holding.unitPrice !== undefined && (
              <span className="text-xs text-slate-400">Buy Price: {formatK(holding.unitPrice)} {holding.entryCurrency || 'SGD'}</span>
            )}
            {holding.currentUnitPrice !== undefined && (
              <span className="text-xs text-slate-400">
                Current Price: {formatK(holding.currentUnitPrice)} {holding.entryCurrency || 'SGD'}
                {holding.entryCurrency !== displayCurrency && exchangeRates && (
                  <span className="ml-1">
                    ({formatK(convertCurrency(holding.currentUnitPrice, holding.entryCurrency as CurrencyCode, displayCurrency, exchangeRates))} {displayCurrency})
                  </span>
                )}
              </span>
            )}
            {hasData && (
              <span className={`text-xs font-medium ${
                profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {profitLoss >= 0 ? '+' : ''}{formatK(profitLoss)} {displayCurrency} ({profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-white">
              {mainDisplayK} {displayCurrency}
            </div>
            <div className="text-xs text-slate-400">
              {percentageOfCategory}%
            </div>
          </div>
          
          <div onClick={e => e.stopPropagation()}>
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