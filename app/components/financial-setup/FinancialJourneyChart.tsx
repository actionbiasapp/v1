'use client';

import { YearlyData } from '@/app/lib/types/shared';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';

// Custom Tooltip for the Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-sm shadow-lg">
        <p className="font-bold text-white mb-2">{label}</p>
        {payload.map((pld: any) => (
          <div key={pld.dataKey} style={{ color: pld.color }} className="flex justify-between items-center text-xs">
            <span className="font-semibold">{pld.name}</span>
            <span className="font-bold ml-4">${pld.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialJourneyChart({ yearlyData }: { yearlyData: YearlyData[] }) {
  if (!yearlyData || yearlyData.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8 bg-slate-800/50 rounded-lg">
        No financial data available to display the journey.
      </div>
    );
  }

  const sortedData = [...yearlyData].sort((a, b) => a.year - b.year);

  return (
    <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Financial Journey</h3>
          <p className="text-sm text-slate-400">An overview of your key financial metrics over time.</p>
        </div>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="year" 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={10} 
              tickFormatter={(value) => `$${(value / 1000)}k`}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#d1d5db' }}>{value}</span>}
            />
            <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#38bdf8" fill="url(#colorNetWorth)" strokeWidth={2} />
            <Area type="monotone" dataKey="income" name="Income" stroke="#34d399" fill="url(#colorIncome)" strokeWidth={2} />
            <Area type="monotone" dataKey="savings" name="Savings" stroke="#a78bfa" fill="url(#colorSavings)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" fill="url(#colorExpenses)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 