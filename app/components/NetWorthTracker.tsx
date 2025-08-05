'use client';

import { useState, useEffect } from 'react';
import { YearlyData, MonthlySnapshot } from '@/app/lib/types/shared';
import { formatNumberWithVisibility } from '@/app/lib/numberVisibility';
import { useNumberVisibility } from '@/app/lib/context/NumberVisibilityContext';
import { type CurrencyCode, type ExchangeRates, CURRENCY_INFO, convertCurrency } from '@/app/lib/currency';
import { ChartLoader } from '@/app/components/ui/Loader';
import { mergeMonthlyAndYearlyData } from '@/app/lib/monthlyToYearlyAggregation';
import { 
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  CartesianGrid
} from 'recharts';
import { calculateFinancialMetrics } from '@/app/lib/financialUtils';

// Custom Tooltip for the Chart
const CustomTooltip = ({ active, payload, label, displayCurrency = 'SGD' }: any) => {
  const { numbersVisible } = useNumberVisibility();
  const currencySymbol = CURRENCY_INFO[displayCurrency as CurrencyCode]?.symbol || '$';
  
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm">
        <p className="font-bold text-white mb-2">{label}</p>
        <p className="text-blue-400">Net Worth: {currencySymbol}{formatNumberWithVisibility(data.netWorth, numbersVisible)}</p>
        <p className="text-emerald-400">Market Gains: {currencySymbol}{formatNumberWithVisibility(data.marketGains, numbersVisible)}</p>
        <p className="text-indigo-400">Savings: {currencySymbol}{formatNumberWithVisibility(data.savings, numbersVisible)}</p>
      </div>
    );
  }
  return null;
};

export default function NetWorthTracker({ 
  yearlyData, 
  monthlySnapshots = [],
  portfolioTotal,
  displayCurrency = 'SGD',
  exchangeRates = null,
  loading = false
}: { 
  yearlyData: YearlyData[], 
  monthlySnapshots?: MonthlySnapshot[],
  portfolioTotal?: number,
  displayCurrency?: CurrencyCode,
  exchangeRates?: ExchangeRates | null,
  loading?: boolean
}) {
  const [error, setError] = useState<string | null>(null);

  // Merge monthly and yearly data, with monthly data taking precedence
  const mergedData = mergeMonthlyAndYearlyData(monthlySnapshots, yearlyData);

  // Convert historical data to display currency if needed
  const convertedData = mergedData.map((data) => {
    if (displayCurrency === 'SGD' || !exchangeRates) {
      return data;
    }
    
    return {
      ...data,
      income: convertCurrency(data.income, 'SGD', displayCurrency, exchangeRates),
      expenses: convertCurrency(data.expenses, 'SGD', displayCurrency, exchangeRates),
      savings: convertCurrency(data.savings, 'SGD', displayCurrency, exchangeRates),
      netWorth: convertCurrency(data.netWorth, 'SGD', displayCurrency, exchangeRates),
      marketGains: convertCurrency(data.marketGains, 'SGD', displayCurrency, exchangeRates),
      srs: convertCurrency(data.srs, 'SGD', displayCurrency, exchangeRates)
    };
  });

  // Always use live portfolio value for current year's net worth
  const currentYear = new Date().getFullYear();
  const updatedData = convertedData.map((y) =>
    y.year === currentYear && portfolioTotal
      ? { ...y, netWorth: portfolioTotal }
      : y
  );

  const processedData = calculateFinancialMetrics(updatedData);

  if (loading) {
    return <ChartLoader className="mb-6" />;
  }
  if (error) {
    return <div className="text-center text-red-400 py-8">{error}</div>;
  }
  
  const chartData = updatedData.map((data, index) => {
    const previousNetWorth = index > 0 ? updatedData[index - 1].netWorth : 0;
    return {
      ...data,
      previousNetWorth: previousNetWorth,
      stackedNetWorth: [previousNetWorth, data.savings, data.marketGains]
    };
  });

  return (
    <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Net Worth Journey</h2>
          <p className="text-sm text-slate-400">Your historical net worth, savings, and market performance.</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-500 rounded-full"></div><span className="text-slate-400">Net Worth</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span className="text-slate-400">Market Gains</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div><span className="text-slate-400">Savings</span></div>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMarketGains" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickFormatter={(value) => {
                const currencySymbol = CURRENCY_INFO[displayCurrency]?.symbol || '$';
                if (value >= 1000000) {
                  return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
                } else {
                  return `${currencySymbol}${value.toFixed(0)}`;
                }
              }} 
            />
            <Tooltip content={<CustomTooltip displayCurrency={displayCurrency} />} />
            <Area type="monotone" dataKey="netWorth" stroke="#06b6d4" fill="url(#colorNetWorth)" />
            <Area type="monotone" dataKey="marketGains" stackId="1" stroke="#22c55e" fill="url(#colorMarketGains)" />
            <Area type="monotone" dataKey="savings" stackId="1" stroke="#6366f1" fill="url(#colorSavings)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}