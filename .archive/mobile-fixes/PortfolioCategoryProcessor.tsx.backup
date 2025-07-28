'use client';

import { formatCurrency, type CurrencyCode, getHoldingDisplayValue } from '@/app/lib/currency';
import { CategoryData, Holding } from '@/app/lib/types/shared';

interface Intelligence {
  allocationIntelligence?: Array<{
    name: string;
    status: 'perfect' | 'underweight' | 'excess';
    callout: string;
  }>;
}

interface PortfolioCategoryProcessorProps {
  holdings: Holding[];
  totalValue: number;
  displayCurrency: CurrencyCode;
  intelligence?: Intelligence;
}

// Portfolio targets configuration
const targets = {
  Core: 25,
  Growth: 55, 
  Hedge: 10,
  Liquidity: 10
};

// Category configuration with icons and colors
const categoryConfig = {
  Core: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
      </svg>
    ),
    color: '#3b82f6',
    description: 'Broad market index funds providing stable foundation'
  },
  Growth: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <circle cx="8" cy="8" r="6"></circle>
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path>
        <path d="M7 6h1v4"></path>
        <path d="M16.71 13.88l.7.71-2.82 2.82"></path>
      </svg>
    ),
    color: '#8b5cf6',
    description: 'Individual growth stocks and emerging technologies'
  },
  Hedge: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
    color: '#eab308',
    description: 'Alternative assets providing portfolio protection'
  },
  Liquidity: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
      </svg>
    ),
    color: '#06b6d4',
    description: 'Cash and cash equivalents for opportunities'
  }
};

export function usePortfolioCategoryProcessor({ 
  holdings, 
  totalValue, 
  displayCurrency, 
  intelligence 
}: PortfolioCategoryProcessorProps) {
  // Group holdings by category with multi-currency support
  const categoryData: CategoryData[] = Object.entries(targets).map(([categoryName, target]) => {
    const categoryHoldings = Array.isArray(holdings) ? holdings.filter(h => h.category === categoryName) : [];
    const currentValue = categoryHoldings.reduce((sum, h) => sum + getHoldingDisplayValue(h, displayCurrency), 0);
    const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    const gap = currentPercent - target;
    const targetValue = (target / 100) * totalValue;
    const gapAmount = currentValue - targetValue;

    // Get intelligence callout if available
    const intelligenceData = intelligence?.allocationIntelligence?.find(intel => intel.name === categoryName);
    
    // Determine status
    let status: 'perfect' | 'underweight' | 'excess';
    let statusText: string;
    
    if (intelligenceData) {
      status = intelligenceData.status;
      statusText = intelligenceData.callout;
    } else {
      // Fallback logic
      const isOnTarget = Math.abs(gap) <= 2;
      const isUnder = gap < -2;
      
      if (isOnTarget) {
        status = 'perfect';
        statusText = 'Perfect allocation';
      } else if (isUnder) {
        status = 'underweight';
        statusText = `Add ${formatCurrency(Math.abs(gapAmount), displayCurrency, { compact: true })} needed`;
      } else {
        status = 'excess';
        statusText = `Trim ${formatCurrency(Math.abs(gapAmount), displayCurrency, { compact: true })} excess`;
      }
    }

    return {
      name: categoryName,
      holdings: categoryHoldings,
      currentValue,
      currentPercent,
      target,
      gap,
      gapAmount,
      status,
      statusText,
      callout: intelligenceData?.callout
    };
  });

  // Enhanced category data with icons, colors, and descriptions
  const enhancedCategoryData = categoryData.map(category => {
    const config = categoryConfig[category.name as keyof typeof categoryConfig];

    return {
      ...category,
      ...config,
      id: category.name
    };
  });

  return enhancedCategoryData;
}

// Export the hook and types for use in other components
export type { PortfolioCategoryProcessorProps };
export default usePortfolioCategoryProcessor;