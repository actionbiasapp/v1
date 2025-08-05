'use client';

import { formatCurrencyWithVisibility } from '@/app/lib/numberVisibility';
import { useNumberVisibility } from '@/app/lib/context/NumberVisibilityContext';
import { type CurrencyCode, type ExchangeRates, convertCurrency } from '@/app/lib/currency';
import { getFITargetsSync, calculateFIProgress, getNextMilestoneAmount } from '@/app/lib/fiTargets';
import { IntelligenceReport } from '@/app/lib/types/shared';
import { MetricsLoader } from '@/app/components/ui/Loader';
import { APP_CONFIG } from '@/app/lib/config';
import { MonthlySnapshot } from '@/app/lib/types/shared';

interface PortfolioStatusMetricsProps {
  totalValue: number;
  displayCurrency: CurrencyCode;
  intelligence?: IntelligenceReport;
  exchangeRates?: ExchangeRates | null;
  loading?: boolean;
  monthlySnapshots?: MonthlySnapshot[]; // Add monthly snapshots prop
}

export default function PortfolioStatusMetrics({ 
  totalValue, 
  displayCurrency, 
  intelligence, 
  exchangeRates,
  loading = false,
  monthlySnapshots = []
}: PortfolioStatusMetricsProps) {
  const { numbersVisible } = useNumberVisibility();
  
  // Calculate total savings from monthly snapshots
  const calculateTotalSavings = () => {
    if (monthlySnapshots.length === 0) {
      // Fallback to hardcoded value if no monthly data
      const savingsInSGD = APP_CONFIG.FINANCIAL.DEFAULT_TOTAL_SAVINGS;
      return exchangeRates && displayCurrency !== 'SGD' 
        ? convertCurrency(savingsInSGD, 'SGD', displayCurrency, exchangeRates)
        : savingsInSGD;
    }
    
    // Calculate total savings from monthly snapshots
    const totalSavingsInSGD = monthlySnapshots.reduce((total, snapshot) => {
      const savings = snapshot.income - snapshot.expenses;
      return total + savings;
    }, 0);
    
    // Convert to display currency
    return exchangeRates && displayCurrency !== 'SGD'
      ? convertCurrency(totalSavingsInSGD, 'SGD', displayCurrency, exchangeRates)
      : totalSavingsInSGD;
  };
  
  const totalSavings = calculateTotalSavings();
  const totalGains = totalValue - totalSavings;
  
  // Get FI targets in display currency
  const fiTargets = getFITargetsSync(displayCurrency, exchangeRates || null);
  const fiProgressData = calculateFIProgress(totalValue, displayCurrency, exchangeRates || null);

  if (loading) {
    return <MetricsLoader className="mb-6" />;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 lg:p-6 mb-6 border border-gray-700">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-6">
        {/* Portfolio Metrics - 3-column Grid on Mobile, Horizontal on Desktop */}
        <div className="grid grid-cols-3 lg:flex lg:gap-8 gap-4">
          <div>
            <p className="text-2xl lg:text-4xl font-bold text-green-400">
              {formatCurrencyWithVisibility(totalValue, displayCurrency, numbersVisible, { compact: false, precision: 0 })}
            </p>
            <p className="text-sm text-gray-400">Portfolio Value</p>
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-blue-400">
              {formatCurrencyWithVisibility(totalSavings, displayCurrency, numbersVisible, { compact: false, precision: 0 })}
            </p>
            <p className="text-sm text-gray-400">Total Savings</p>
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-purple-400">
              {formatCurrencyWithVisibility(totalGains, displayCurrency, numbersVisible, { compact: false, precision: 0 })}
            </p>
            <p className="text-sm text-gray-400">Total Gains</p>
          </div>
        </div>

        {/* FI Progress Bar - Full Width on Mobile */}
        <div className="w-full lg:flex-1 lg:ml-8">
          <div className="relative bg-gray-700 rounded-full h-4 mb-2">
            {/* First Million Progress (0 to 40%) */}
            <div 
              className="absolute h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full"
              style={{ width: `${Math.min(fiProgressData.firstMillionProgress, 100) * 0.4}%` }}
            />
            
            {/* Lean FI Progress (40% to 74%) */}
            {totalValue > fiTargets.firstMillion && (
              <div 
                className="absolute h-4 bg-gradient-to-r from-yellow-500 to-yellow-400"
                style={{ 
                  left: '40%',
                  width: `${Math.min(fiProgressData.leanFIProgress, 100) * 0.34}%` 
                }}
              />
            )}
            
            {/* Full FI Progress (74% to 100%) */}
            {totalValue > fiTargets.leanFI && (
              <div 
                className="absolute h-4 bg-gradient-to-r from-green-500 to-green-400 rounded-r-full"
                style={{ 
                  left: '74%',
                  width: `${Math.min(fiProgressData.fullFIProgress, 100) * 0.26}%` 
                }}
              />
            )}
            
            {/* Milestone markers */}
            <div className="absolute top-0 left-[40%] w-0.5 h-4 bg-white opacity-70"></div>
            <div className="absolute top-0 left-[74%] w-0.5 h-4 bg-white opacity-70"></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>0</span>
            <span>{formatCurrencyWithVisibility(fiTargets.firstMillion, displayCurrency, numbersVisible, { compact: true })}</span>
            <span className="hidden sm:inline">{formatCurrencyWithVisibility(fiTargets.leanFI, displayCurrency, numbersVisible, { compact: true })} (Lean)</span>
            <span className="sm:hidden">{formatCurrencyWithVisibility(fiTargets.leanFI, displayCurrency, numbersVisible, { compact: true })}</span>
            <span className="hidden sm:inline">{formatCurrencyWithVisibility(fiTargets.fullFI, displayCurrency, numbersVisible, { compact: true })} (Full FI)</span>
            <span className="sm:hidden">{formatCurrencyWithVisibility(fiTargets.fullFI, displayCurrency, numbersVisible, { compact: true })}</span>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">
              {totalValue < fiTargets.firstMillion ? (
                `${formatCurrencyWithVisibility(fiTargets.firstMillion - totalValue, displayCurrency, numbersVisible, { compact: true })} to first million`
              ) : totalValue < fiTargets.leanFI ? (
                `${formatCurrencyWithVisibility(fiTargets.leanFI - totalValue, displayCurrency, numbersVisible, { compact: true })} to Lean FI`
              ) : totalValue < fiTargets.fullFI ? (
                `${formatCurrencyWithVisibility(fiTargets.fullFI - totalValue, displayCurrency, numbersVisible, { compact: true })} to Full FI`
              ) : (
                "🎉 Financial Independence Achieved!"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}