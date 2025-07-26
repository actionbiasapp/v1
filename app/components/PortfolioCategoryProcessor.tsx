// app/components/PortfolioCategoryProcessor.tsx - Add completion-based logic
import { useMemo, useEffect, useState } from 'react';
import { type CurrencyCode } from '@/app/lib/currency';
import { type Intelligence, type CategoryData, type Holding } from '@/app/lib/types/shared';
import { calculateHoldingValue, type ExchangeRates } from '@/app/lib/portfolioCalculations';
import { DEFAULT_ALLOCATION_TARGETS } from '@/app/lib/constants';

interface PortfolioCategoryProcessorProps {
  holdings: Holding[];
  totalValue: number;
  displayCurrency: CurrencyCode;
  intelligence?: Intelligence;
  customTargets?: {
    core: number;
    growth: number;
    hedge: number;
    liquidity: number;
    rebalanceThreshold: number;
  };
}

export function usePortfolioCategoryProcessor({
  holdings,
  totalValue,
  displayCurrency,
  intelligence,
  customTargets
}: PortfolioCategoryProcessorProps): CategoryData[] {
  const [usdToSgd, setUsdToSgd] = useState(1.35);
  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch('/api/exchange-rates');
        if (res.ok) {
          const data = await res.json();
          if (data.rates && data.rates.USD_TO_SGD) setUsdToSgd(Number(data.rates.USD_TO_SGD));
        }
      } catch {}
    }
    fetchRate();
  }, []);

    return useMemo(() => {
    // Use custom targets if provided, otherwise use defaults
    const targets = customTargets || DEFAULT_ALLOCATION_TARGETS;

    // Category definitions with custom targets
    const categories = [
      {
        name: 'Core',
        target: targets.core,
        color: 'bg-blue-500',
        icon: '🛡️',
        description: 'Stable dividend stocks, bonds, REITs'
      },
      {
        name: 'Growth',
        target: targets.growth,
        color: 'bg-green-500',
        icon: '📈',
        description: 'Growth stocks, tech, emerging markets'
      },
      {
        name: 'Hedge',
        target: targets.hedge,
        color: 'bg-yellow-500',
        icon: '⚖️',
        description: 'Gold, commodities, hedge funds'
      },
      {
        name: 'Liquidity',
        target: targets.liquidity,
        color: 'bg-purple-500',
        icon: '💰',
        description: 'Cash, money market, short-term bonds'
      }
    ];

    // Process each category
    return categories.map(category => {
      const categoryHoldings = holdings
        .filter(h => h.category === category.name)
        .sort((a, b) => a.symbol.localeCompare(b.symbol)); // Sort alphabetically by symbol
      
      // Calculate current value using centralized calculation
      const exchangeRates: ExchangeRates | null = usdToSgd ? {
        SGD_TO_USD: 1 / usdToSgd,
        SGD_TO_INR: 63.0, // Approximate rate
        USD_TO_SGD: usdToSgd,
        USD_TO_INR: usdToSgd * 63.0,
        INR_TO_SGD: 1 / 63.0,
        INR_TO_USD: 1 / (usdToSgd * 63.0)
      } : null;
      
      const currentValue = categoryHoldings.reduce((sum, holding) => {
        return sum + calculateHoldingValue(holding, displayCurrency, exchangeRates);
      }, 0);

      const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
      
      // EXISTING: Gap-based calculations (keep for compatibility)
      const gap = currentPercent - category.target;
      const gapAmount = (gap / 100) * totalValue;

      // NEW: Completion-based calculations
      const completionPercent = category.target > 0 ? (currentPercent / category.target) * 100 : 0;

      // Determine status using custom rebalance threshold
      const threshold = targets.rebalanceThreshold;
      let status: 'perfect' | 'underweight' | 'excess';
      let shortStatus: string;
      let detailedStatus: string;

      if (Math.abs(gap) <= threshold) {
        status = 'perfect';
        shortStatus = '✅ On Track';
        detailedStatus = `At ${currentPercent.toFixed(1)}%, you are within your ${threshold}% threshold for your ${category.target}% target.`;
      } else if (gap < 0) {
        status = 'underweight';
        const shortfall = 100 - completionPercent;
        shortStatus = `${shortfall.toFixed(0)}% to goal`;
        detailedStatus = `You are ${shortfall.toFixed(0)}% under your target. Consider adding $${Math.abs(gapAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })} to reach your goal.`;
      } else {
        status = 'excess';
        const overage = completionPercent - 100;
        shortStatus = `${overage.toFixed(0)}% Over`;
        detailedStatus = `You are ${overage.toFixed(0)}% over your target. Consider rebalancing $${gapAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} to other categories.`;
      }
      
      return {
        ...category,
        holdings: categoryHoldings,
        currentValue,
        currentPercent,
        completionPercent,
        gap,
        gapAmount,
        status,
        statusText: detailedStatus,
        shortStatus,
        callout: undefined, // Let's generate this locally
      };
    });
  }, [holdings, totalValue, displayCurrency, intelligence, customTargets]);
}