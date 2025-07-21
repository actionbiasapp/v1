'use client';

import { useState, useEffect } from 'react';
import { YearlyData } from '@/app/lib/types/shared';
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
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm">
        <p className="font-bold text-white mb-2">{label}</p>
        <p className="text-blue-400">Net Worth: ${data.netWorth.toLocaleString()}</p>
        <p className="text-emerald-400">Market Gains: ${data.marketGains.toLocaleString()}</p>
        <p className="text-indigo-400">Savings: ${data.savings.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function NetWorthTracker({ yearlyData }: { yearlyData: YearlyData[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processedData = calculateFinancialMetrics(yearlyData);

  if (loading) {
    return <div className="text-center text-slate-400 py-8">Loading yearly data...</div>;
  }
  if (error) {
    return <div className="text-center text-red-400 py-8">{error}</div>;
  }
  
  const chartData = yearlyData.map((data, index) => {
    const previousNetWorth = index > 0 ? yearlyData[index - 1].netWorth : 0;
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
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-500 rounded-sm"></div><span className="text-slate-400">Net Worth</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm"></div><span className="text-slate-400">Market Gains</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div><span className="text-slate-400">Savings</span></div>
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
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${(value / 1000)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="netWorth" stroke="#06b6d4" fill="url(#colorNetWorth)" />
            <Area type="monotone" dataKey="marketGains" stackId="1" stroke="#22c55e" fill="url(#colorMarketGains)" />
            <Area type="monotone" dataKey="savings" stackId="1" stroke="#6366f1" fill="url(#colorSavings)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}