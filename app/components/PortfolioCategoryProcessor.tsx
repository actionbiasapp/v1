// app/components/PortfolioCategoryProcessor.tsx - Add completion-based logic
import { useMemo } from 'react';
import { type CurrencyCode } from '@/app/lib/currency';
import { type Intelligence, type CategoryData } from '@/app/lib/types/shared';

interface PortfolioCategoryProcessorProps {
  holdings: any[];
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
  return useMemo(() => {
    // Use custom targets if provided, otherwise use defaults
    const targets = customTargets || {
      core: 25,
      growth: 55,
      hedge: 10,
      liquidity: 10,
      rebalanceThreshold: 5
    };

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
      const categoryHoldings = holdings.filter(h => h.category === category.name);
      
      // Calculate current value in display currency
      const currentValue = categoryHoldings.reduce((sum, holding) => {
        const currencyValue = displayCurrency === 'SGD' ? holding.valueSGD :
                             displayCurrency === 'USD' ? holding.valueUSD :
                             holding.valueINR;
        return sum + currencyValue;
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
      let statusText: string;

      if (Math.abs(gap) <= threshold) {
        status = 'perfect';
        statusText = 'Perfect';
      } else if (gap < 0) {
        status = 'underweight';
        // NEW: Completion-based status text
        const shortfall = 100 - completionPercent;
        statusText = shortfall > 0 ? `${Math.round(shortfall)}% to go` : 'Perfect';
      } else {
        status = 'excess';
        // NEW: Over-allocation status text
        const overAmount = completionPercent - 100;
        statusText = `${Math.round(overAmount)}% over`;
      }

      // Get intelligence callout if available
      const allocationIntelligence = intelligence?.allocationIntelligence?.find(
        intel => intel.name === category.name
      );
      
      return {
        ...category,
        holdings: categoryHoldings,
        currentValue,
        currentPercent,
        completionPercent, // NEW: Add completion percentage
        gap,
        gapAmount,
        status,
        statusText,
        callout: allocationIntelligence?.callout
      };
    });
  }, [holdings, totalValue, displayCurrency, intelligence, customTargets]);
}