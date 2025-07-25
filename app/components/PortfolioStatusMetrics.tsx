'use client';

import { formatCurrency, type CurrencyCode } from '@/app/lib/currency';
import { IntelligenceReport } from '@/app/lib/types/shared';

interface PortfolioStatusMetricsProps {
  totalValue: number;
  displayCurrency: CurrencyCode;
  intelligence?: IntelligenceReport;
  isLive: boolean;
}

// Live indicator component
const LiveIndicator = () => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    <span className="text-xs text-green-400">Live</span>
  </div>
);

export default function PortfolioStatusMetrics({ 
  totalValue, 
  displayCurrency, 
  intelligence, 
  isLive 
}: PortfolioStatusMetricsProps) {
  // Calculate derived metrics
  const totalSavings = 350000; // This could be passed as prop or calculated
  const totalGains = totalValue - totalSavings;
  
  // Use intelligence FI progress or calculate fallback
  const fiProgressText = intelligence?.statusIntelligence?.fiProgress || 
    `${((totalValue / 1000000) * 100).toFixed(1)}% to first million`;

  // FI Progress calculation for progress bar
  const fiProgress = (totalValue / 1000000) * 100;
  const leanFIProgress = Math.max(0, ((totalValue - 1000000) / 850000) * 100);
  const fullFIProgress = Math.max(0, ((totalValue - 1850000) / 650000) * 100);

  return (
    <div className="bg-gray-800 rounded-lg p-4 lg:p-6 mb-6 border border-gray-700">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-6">
        {/* Portfolio Metrics - 2x2 Grid on Mobile, Horizontal on Desktop */}
        <div className="grid grid-cols-2 lg:flex lg:gap-8 gap-4">
          <div>
            <p className="text-2xl lg:text-4xl font-bold text-green-400">
              {formatCurrency(totalValue, displayCurrency, { compact: false, precision: 0 })}
            </p>
            <p className="text-sm text-gray-400">Portfolio Value</p>
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-blue-400">
              {formatCurrency(totalSavings, displayCurrency, { compact: false, precision: 0 })}
            </p>
            <p className="text-sm text-gray-400">Total Savings</p>
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-purple-400">
              {formatCurrency(totalGains, displayCurrency, { compact: false, precision: 0 })}
            </p>
            <p className="text-sm text-gray-400">Total Gains</p>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p className="text-xl lg:text-2xl font-bold text-blue-400">{fiProgressText}</p>
              {isLive && <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>}
            </div>
            <p className="text-sm text-gray-400">FI Progress</p>
            {/* Removed intelligence insights: urgentAction and deadline */}
          </div>
        </div>

        {/* FI Progress Bar - Full Width on Mobile */}
        <div className="w-full lg:flex-1 lg:ml-8">
          <div className="relative bg-gray-700 rounded-full h-4 mb-2">
            {/* First Million Progress (0 to 40%) */}
            <div 
              className="absolute h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full"
              style={{ width: `${Math.min(fiProgress, 100) * 0.4}%` }}
            />
            
            {/* Lean FI Progress (40% to 74%) */}
            {totalValue > 1000000 && (
              <div 
                className="absolute h-4 bg-gradient-to-r from-yellow-500 to-yellow-400"
                style={{ 
                  left: '40%',
                  width: `${Math.min(leanFIProgress, 100) * 0.34}%` 
                }}
              />
            )}
            
            {/* Full FI Progress (74% to 100%) */}
            {totalValue > 1850000 && (
              <div 
                className="absolute h-4 bg-gradient-to-r from-green-500 to-green-400 rounded-r-full"
                style={{ 
                  left: '74%',
                  width: `${Math.min(fullFIProgress, 100) * 0.26}%` 
                }}
              />
            )}
            
            {/* Milestone markers */}
            <div className="absolute top-0 left-[40%] w-0.5 h-4 bg-white opacity-70"></div>
            <div className="absolute top-0 left-[74%] w-0.5 h-4 bg-white opacity-70"></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>0</span>
            <span>1M</span>
            <span className="hidden sm:inline">1.85M (Lean)</span>
            <span className="sm:hidden">1.85M</span>
            <span className="hidden sm:inline">2.5M (Full FI)</span>
            <span className="sm:hidden">2.5M</span>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">
              {totalValue < 1000000 ? (
                `${formatCurrency(1000000 - totalValue, displayCurrency, { compact: true })} to first milestone`
              ) : totalValue < 1850000 ? (
                `${formatCurrency(1850000 - totalValue, displayCurrency, { compact: true })} to Lean FI`
              ) : totalValue < 2500000 ? (
                `${formatCurrency(2500000 - totalValue, displayCurrency, { compact: true })} to Full FI`
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