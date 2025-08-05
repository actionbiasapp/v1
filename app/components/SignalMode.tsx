// app/components/SignalMode.tsx - Signal Over Noise: Focus on What Matters
'use client';

import { useState, useEffect } from 'react';
import { type Holding, type YearlyData } from '@/app/lib/types/shared';
import { type CurrencyCode } from '@/app/lib/currency';
import { calculatePortfolioValue, type ExchangeRates } from '@/app/lib/portfolioCalculations';
import { DEFAULT_ALLOCATION_TARGETS } from '@/app/lib/constants';
import { calculateYTDPerformance, calculateOverallGains } from '@/app/lib/financialUtils';
import { formatNumberWithVisibility } from '@/app/lib/numberVisibility';
import { useNumberVisibility } from '@/app/lib/context/NumberVisibilityContext';

interface SignalModeProps {
  holdings: Holding[];
  displayCurrency: CurrencyCode;
  exchangeRates: ExchangeRates | null;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  yearlyData?: YearlyData[];
  allocationTargets?: {
    core: number;
    growth: number;
    hedge: number;
    liquidity: number;
    rebalanceThreshold: number;
  };
}

interface SignalData {
  totalValue: number;
  biggestHolding: { symbol: string; name: string; value: number; percentage: number };
  performance: { totalGain: number; percentageChange: number; timeframe: string; startingValue?: number };
  overallGains: { totalGain: number; percentageChange: number; totalSavings: number };
  allocationTargets: Array<{
    category: string;
    current: number;
    target: number;
    gap: number;
    gapAmount: number;
  }>;
  nextAction: string;
  rebalanceThreshold: number;
}

export default function SignalMode({
  holdings,
  displayCurrency,
  exchangeRates,
  isEnabled,
  onToggle,
  yearlyData,
  allocationTargets
}: SignalModeProps) {
  const { numbersVisible } = useNumberVisibility();
  const [signalData, setSignalData] = useState<SignalData | null>(null);

  useEffect(() => {
    if (isEnabled && holdings.length > 0) {
      const data = calculateSignalData(holdings, displayCurrency, exchangeRates, allocationTargets, yearlyData);
      setSignalData(data);
    }
  }, [isEnabled, holdings, displayCurrency, exchangeRates, allocationTargets, yearlyData]);

  if (!isEnabled) {
    return null;
  }

  if (!signalData) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-white mt-4">Calculating signal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-white">Signal Mode</h1>
            <p className="text-gray-400">Focus on what matters most</p>
          </div>
        </div>
        <button
          onClick={() => onToggle(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
        >
          Exit Signal Mode
        </button>
      </div>

      {/* Main Content - Distraction Free */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          
          {/* Portfolio Value - Hero */}
          <div className="space-y-4">
            <h2 className="text-gray-400 text-lg">Total Portfolio Value</h2>
            <div className="text-6xl font-bold text-white">
              {formatNumberWithVisibility(Math.round(signalData.totalValue), numbersVisible)}
            </div>
            <div className="text-xl text-gray-400">{displayCurrency}</div>
          </div>

          {/* Performance - Key Metric */}
          <div className="space-y-4">
            <h3 className="text-gray-400 text-lg">Year to Date Performance</h3>
            <div className="text-4xl font-bold text-white">
              {signalData.performance.totalGain > 0 ? '+' : ''}{formatNumberWithVisibility(Math.round(signalData.performance.totalGain), numbersVisible)}
            </div>
            <div className={`text-2xl font-semibold ${signalData.performance.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {signalData.performance.percentageChange >= 0 ? '+' : ''}{Math.round(signalData.performance.percentageChange)}%
            </div>
          </div>

          {/* Next Action - The One Thing */}
          {signalData.nextAction && (
            <div className="space-y-6 pt-8">
              <h3 className="text-gray-400 text-lg">Next Action</h3>
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {signalData.nextAction}
                </div>
                <p className="text-gray-300 text-lg">
                  This action will have the maximum impact on your portfolio right now.
                </p>
              </div>
            </div>
          )}

          {/* Biggest Holding - Context */}
          <div className="space-y-4 pt-8">
            <h3 className="text-gray-400 text-lg">Biggest Position</h3>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="text-3xl font-bold text-white mb-2">
                {signalData.biggestHolding.symbol}
              </div>
              <div className="text-gray-300 text-lg mb-2">
                {signalData.biggestHolding.name}
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumberWithVisibility(Math.round(signalData.biggestHolding.value), numbersVisible)} {displayCurrency}
              </div>
              <div className="text-gray-400 text-lg">
                {signalData.biggestHolding.percentage.toFixed(1)}% of portfolio
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateSignalData(
  holdings: Holding[],
  displayCurrency: CurrencyCode,
  exchangeRates: ExchangeRates | null,
  userAllocationTargets?: {
    core: number;
    growth: number;
    hedge: number;
    liquidity: number;
    rebalanceThreshold: number;
  },
  yearlyData?: YearlyData[]
): SignalData {
  // Calculate total value
  const portfolioResult = calculatePortfolioValue(holdings, displayCurrency, exchangeRates);
  const totalValue = portfolioResult.totalValue;

  // Find biggest holding
  const holdingValues = holdings.map(h => {
    const result = calculatePortfolioValue([h], displayCurrency, exchangeRates);
    return {
      ...h,
      value: result.totalValue
    };
  });

  const biggestHolding = holdingValues.reduce((max, h) => h.value > max.value ? h : max);
  const biggestPercentage = totalValue > 0 ? (biggestHolding.value / totalValue) * 100 : 0;

  // Find allocation gaps using user's actual targets or fallback to defaults
  const categories = groupByCategory(holdings);
  const targets = userAllocationTargets || DEFAULT_ALLOCATION_TARGETS;
  const rebalanceThreshold = userAllocationTargets?.rebalanceThreshold || DEFAULT_ALLOCATION_TARGETS.rebalanceThreshold;
  
  const gaps = Object.entries(categories).map(([category, categoryHoldings]) => {
    const categoryResult = calculatePortfolioValue(categoryHoldings, displayCurrency, exchangeRates);
    const categoryValue = categoryResult.totalValue;
    const currentPercent = totalValue > 0 ? (categoryValue / totalValue) * 100 : 0;
    const targetPercent = targets[category.toLowerCase() as keyof typeof targets] || 0;
    const gap = currentPercent - targetPercent;
    
    return {
      category,
      gap,
      gapAmount: (gap / 100) * totalValue
    };
  }).filter(gap => Math.abs(gap.gap) > rebalanceThreshold);

  const biggestGap = gaps.length > 0 ? gaps.reduce((max, gap) => Math.abs(gap.gap) > Math.abs(max.gap) ? gap : max) : null;

  // Calculate YTD performance using yearly data
  const ytdPerformance = calculateYTDPerformance(yearlyData || [], totalValue);
  const totalGain = ytdPerformance.totalGain;
  const percentageChange = ytdPerformance.percentageChange;
  const timeframe = ytdPerformance.timeframe;
  const startingValue = ytdPerformance.startingValue;

  // Calculate overall gains
  const overallGains = calculateOverallGains(yearlyData || [], totalValue);

  // Determine next action - Focus on the ONE thing that will have maximum impact
  let nextAction = "Your portfolio looks balanced!";
  let allocationGap = null;

  if (biggestGap) {
    const direction = biggestGap.gap > 0 ? 'overweight' : 'underweight';
    const action = biggestGap.gap > 0 ? 'Reduce' : 'Add to';
    const amount = Math.abs(biggestGap.gapAmount);
    
    nextAction = `${action} ${biggestGap.category} by ${formatNumberWithVisibility(Math.round(amount), true)} ${displayCurrency}`;
    allocationGap = {
      category: biggestGap.category,
      gap: biggestGap.gap,
      action: action,
      amount: amount
    };
  } else if (biggestPercentage > 30) {
    nextAction = `Diversify ${biggestHolding.symbol} - ${biggestPercentage.toFixed(1)}% is too concentrated`;
  } else if (totalValue === 0) {
    nextAction = "Start with your first investment";
  } else if (Math.abs(percentageChange) > 10) {
    // If performance is significantly up or down, suggest action
    if (percentageChange > 10) {
      nextAction = "Consider taking some profits";
    } else {
      nextAction = "Consider dollar-cost averaging";
    }
  } else if (totalValue < 100000) {
    nextAction = "Focus on building your emergency fund first";
  }

  // Calculate allocation targets vs current using user's actual targets
  const allocationTargets = Object.entries(categories).map(([category, categoryHoldings]) => {
    const categoryResult = calculatePortfolioValue(categoryHoldings, displayCurrency, exchangeRates);
    const categoryValue = categoryResult.totalValue;
    const currentPercent = totalValue > 0 ? (categoryValue / totalValue) * 100 : 0;
    const targetPercent = targets[category.toLowerCase() as keyof typeof targets] || 0;
    const gap = currentPercent - targetPercent;
    const gapAmount = (gap / 100) * totalValue;
    
    return {
      category,
      current: Math.round(currentPercent * 10) / 10, // Round to 1 decimal
      target: targetPercent,
      gap: Math.round(gap * 10) / 10,
      gapAmount
    };
  });



  return {
    totalValue,
    biggestHolding: {
      symbol: biggestHolding.symbol,
      name: biggestHolding.name,
      value: biggestHolding.value,
      percentage: biggestPercentage
    },
    performance: {
      totalGain,
      percentageChange,
      timeframe,
      startingValue
    },
    overallGains,
    allocationTargets,
    nextAction,
    rebalanceThreshold
  };
}

function groupByCategory(holdings: Holding[]): Record<string, Holding[]> {
  return holdings.reduce((groups, holding) => {
    const category = holding.category || 'Uncategorized';
    if (!groups[category]) groups[category] = [];
    groups[category].push(holding);
    return groups;
  }, {} as Record<string, Holding[]>);
} 