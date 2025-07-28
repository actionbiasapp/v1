// app/components/SignalMode.tsx - Signal Over Noise: Focus on What Matters
'use client';

import { useState, useEffect } from 'react';
import { type Holding, type YearlyData } from '@/app/lib/types/shared';
import { type CurrencyCode } from '@/app/lib/currency';
import { calculatePortfolioValue, type ExchangeRates } from '@/app/lib/portfolioCalculations';
import { DEFAULT_ALLOCATION_TARGETS } from '@/app/lib/constants';
import { calculateYTDPerformance, calculateOverallGains } from '@/app/lib/financialUtils';

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
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Calculating signal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-hidden">
      {/* Header with close button */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h1 className="text-xl font-bold text-white">Signal Mode</h1>
              <p className="text-sm text-gray-400">Focus on what matters most</p>
            </div>
          </div>
          <button
            onClick={() => onToggle(false)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
          >
            Normal Mode
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          
          {/* Portfolio Value - Hero Section */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 md:p-8 mb-6 md:mb-8 text-center">
            <h2 className="text-base md:text-lg font-medium text-indigo-100 mb-2">Total Portfolio Value</h2>
            <div className="text-4xl md:text-6xl font-bold text-white mb-2">
              {Math.round(signalData.totalValue).toLocaleString()}
            </div>
            <div className="text-lg md:text-xl text-indigo-200">{displayCurrency}</div>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            
            {/* Biggest Holding */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏆</span>
                <h3 className="text-lg font-semibold text-white">Biggest Position</h3>
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-white">
                  {signalData.biggestHolding.symbol}
                </div>
                <div className="text-gray-300">
                  {signalData.biggestHolding.name}
                </div>
                <div className="text-2xl font-bold text-indigo-400">
                  {Math.round(signalData.biggestHolding.value).toLocaleString()} {displayCurrency}
                </div>
                <div className="text-sm text-gray-400">
                  {signalData.biggestHolding.percentage.toFixed(1)}% of portfolio
                </div>
              </div>
            </div>

            {/* Portfolio Performance */}
            <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl p-6 group relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📈</span>
                <h3 className="text-lg font-semibold text-white">Portfolio Performance</h3>
              </div>
              <div className="space-y-4">
                {/* YTD Performance */}
                <div className="border-b border-emerald-500/30 pb-3">
                  <div className="text-sm text-emerald-200 mb-1">Year to Date</div>
                  <div className="text-xl font-bold text-white">
                    {signalData.performance.totalGain > 0 ? '+' : ''}{Math.round(signalData.performance.totalGain).toLocaleString()} {displayCurrency}
                  </div>
                  <div className={`text-sm font-semibold ${signalData.performance.percentageChange >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                    {signalData.performance.percentageChange >= 0 ? '+' : ''}{Math.round(signalData.performance.percentageChange)}%
                  </div>
                </div>
                
                {/* Overall Performance */}
                <div>
                  <div className="text-sm text-emerald-200 mb-1">Overall Gains</div>
                  <div className="text-xl font-bold text-white">
                    {signalData.overallGains.totalGain > 0 ? '+' : ''}{Math.round(signalData.overallGains.totalGain).toLocaleString()} {displayCurrency}
                  </div>
                  <div className={`text-sm font-semibold ${signalData.overallGains.percentageChange >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                    {signalData.overallGains.percentageChange >= 0 ? '+' : ''}{Math.round(signalData.overallGains.percentageChange)}%
                  </div>
                  <div className="text-xs text-emerald-200/80 mt-1">
                    From {Math.round(signalData.overallGains.totalSavings).toLocaleString()} {displayCurrency} total savings
                  </div>
                </div>
              </div>
              
              {/* Hover tooltip with performance details */}
              {signalData.performance.startingValue && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  <div>YTD Starting: {Math.round(signalData.performance.startingValue).toLocaleString()} {displayCurrency}</div>
                  <div>Current Value: {Math.round(signalData.totalValue).toLocaleString()} {displayCurrency}</div>
                  <div>YTD Gain: {signalData.performance.totalGain > 0 ? '+' : ''}{Math.round(signalData.performance.totalGain).toLocaleString()} {displayCurrency}</div>
                  <div>YTD Return: {signalData.performance.percentageChange >= 0 ? '+' : ''}{Math.round(signalData.performance.percentageChange)}%</div>
                  <div className="border-t border-gray-600 mt-1 pt-1">Total Savings: {Math.round(signalData.overallGains.totalSavings).toLocaleString()} {displayCurrency}</div>
                  <div>Overall Gain: {signalData.overallGains.totalGain > 0 ? '+' : ''}{Math.round(signalData.overallGains.totalGain).toLocaleString()} {displayCurrency}</div>
                  <div>Overall Return: {signalData.overallGains.percentageChange >= 0 ? '+' : ''}{Math.round(signalData.overallGains.percentageChange)}%</div>
                </div>
              )}
            </div>

            {/* Allocation Targets */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🎯</span>
                <h3 className="text-lg font-semibold text-white">Allocation Targets</h3>
              </div>
              <div className="space-y-3">
                {signalData.allocationTargets.map((target, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/90">{target.category}</span>
                      <span className="text-white font-medium">
                        {target.current}% / {target.target}%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          target.gap > signalData.rebalanceThreshold ? 'bg-red-400' : 
                          target.gap < -signalData.rebalanceThreshold ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (target.current / target.target) * 100))}%` }}
                      ></div>
                    </div>
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      <div>Target: {target.target}%</div>
                      <div>Current: {target.current}%</div>
                      <div>Progress: {Math.round((target.current / target.target) * 100)}% of target</div>
                      <div>Gap: {target.gap > 0 ? '+' : ''}{target.gap.toFixed(1)}%</div>
                      <div>Amount: {Math.round(Math.abs(target.gapAmount)).toLocaleString()} {displayCurrency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700">
            <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <button 
                onClick={() => onToggle(false)}
                className="group bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-all duration-200 text-left relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="relative z-10">
                  <div className="text-lg mb-2">📊</div>
                  <div className="font-medium">View Details</div>
                  <div className="text-sm text-gray-400">See full portfolio</div>
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
              
              <button 
                onClick={() => {
                  // TODO: Implement rebalance action
                  console.log('Rebalance clicked');
                }}
                className="group bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-all duration-200 text-left relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="relative z-10">
                  <div className="text-lg mb-2">⚖️</div>
                  <div className="font-medium">Rebalance</div>
                  <div className="text-sm text-gray-400">Adjust allocations</div>
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
              
              <button 
                onClick={() => {
                  // TODO: Implement add position action
                  console.log('Add position clicked');
                }}
                className="group bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-all duration-200 text-left relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="relative z-10">
                  <div className="text-lg mb-2">📈</div>
                  <div className="font-medium">Add Position</div>
                  <div className="text-sm text-gray-400">Buy new holdings</div>
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
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

  // Determine next action
  let nextAction = "Your portfolio looks balanced!";
  let allocationGap = null;

  if (biggestGap) {
    const direction = biggestGap.gap > 0 ? 'overweight' : 'underweight';
    const action = biggestGap.gap > 0 ? 'Consider reducing' : 'Consider adding';
    
    nextAction = `${action} ${biggestGap.category} allocation`;
    allocationGap = {
      category: biggestGap.category,
      gap: biggestGap.gap,
      action: action,
      amount: Math.abs(biggestGap.gapAmount)
    };
  } else if (biggestPercentage > 30) {
    nextAction = "Consider diversifying your largest position";
  } else if (totalValue === 0) {
    nextAction = "Start building your portfolio";
  }

  // Calculate YTD performance using yearly data
  const ytdPerformance = calculateYTDPerformance(yearlyData || [], totalValue);
  const totalGain = ytdPerformance.totalGain;
  const percentageChange = ytdPerformance.percentageChange;
  const timeframe = ytdPerformance.timeframe;
  const startingValue = ytdPerformance.startingValue;

  // Calculate overall gains
  const overallGains = calculateOverallGains(yearlyData || [], totalValue);

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