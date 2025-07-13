// app/components/financial-setup/FinancialProfileTab.tsx
'use client';

import { useState } from 'react';
import { FinancialProfile, YearlyIncomeExpense, calculateSavingsRate } from '@/app/lib/types/financial';
import { FinancialDataManager } from './FinancialDataManager';

const formatNumberWithCommas = (value: number | string): string => {
  if (!value && value !== 0) return '';
  const numStr = value.toString().replace(/,/g, '');
  const num = parseFloat(numStr);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
};

const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

interface FinancialProfileTabProps {
  profile: FinancialProfile;
  onChange: (updates: Partial<FinancialProfile>) => void;
}

export function FinancialProfileTab({ profile, onChange }: FinancialProfileTabProps) {
  const [showDataManager, setShowDataManager] = useState(false);

  const handleNumberInput = (field: keyof FinancialProfile, value: string) => {
    const numericValue = parseFormattedNumber(value);
    onChange({ [field]: numericValue });
  };

  // NetWorthTracker-style year management
  const addNewYear = (year: number, income: number, expenses: number) => {
    const savingsAmount = income - expenses;
    const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0;
    
    const newYearData: YearlyIncomeExpense = { 
      year, 
      income, 
      expenses, 
      savingsAmount,
      savingsRate
    };
    
    const newData = [...profile.yearlyFinancials, newYearData].sort((a, b) => a.year - b.year);
    onChange({ yearlyFinancials: newData });
  };

  const editYear = (year: number, income: number, expenses: number) => {
    const savingsAmount = income - expenses;
    const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0;
    
    const updatedData = profile.yearlyFinancials.map(data => 
      data.year === year 
        ? { ...data, income, expenses, savingsAmount, savingsRate }
        : data
    );
    onChange({ yearlyFinancials: updatedData });
  };

  const deleteYear = (yearToDelete: number) => {
    if (profile.yearlyFinancials.length <= 1) {
      alert("Cannot delete the last remaining data point!");
      return;
    }
    
    if (confirm(`Are you sure you want to delete data for ${yearToDelete}?`)) {
      const filteredData = profile.yearlyFinancials.filter(data => data.year !== yearToDelete);
      onChange({ yearlyFinancials: filteredData });
    }
  };

  const totalIncome = (profile.annualIncome || 0) + (profile.bonusIncome || 0);
  const savingsRate = calculateSavingsRate(totalIncome, profile.annualExpenses || 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Financial Profile</h3>
        <p className="text-slate-400 mb-6">
          Core financial information for portfolio optimization and FI calculations.
        </p>
      </div>

      {/* Current Year Primary Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Annual Employment Income (Current) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              S$
            </span>
            <input
              type="text"
              value={formatNumberWithCommas(profile.annualIncome || '')}
              onChange={(e) => handleNumberInput('annualIncome', e.target.value)}
              placeholder="120,000"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Total Annual Expenses (Current) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              S$
            </span>
            <input
              type="text"
              value={formatNumberWithCommas(profile.annualExpenses || '')}
              onChange={(e) => handleNumberInput('annualExpenses', e.target.value)}
              placeholder="72,000"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Multi-Year Data Management - NetWorthTracker Style */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-md font-medium text-white">Multi-Year Financial Data</h4>
            <p className="text-slate-400 text-sm">
              Track income and expenses across years for better FI projections.
            </p>
          </div>
          <button
            onClick={() => setShowDataManager(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Manage Data
          </button>
        </div>
        
        {profile.yearlyFinancials.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 px-2 font-medium text-slate-300">Year</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-300">Income</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-300">Expenses</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-300">Savings</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-300">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.yearlyFinancials.slice(-5).map((data) => (
                    <tr key={data.year} className="border-b border-slate-700/50">
                      <td className="py-2 px-2 font-medium text-white">{data.year}</td>
                      <td className="py-2 px-2 text-right text-blue-400">
                        S${formatNumberWithCommas(data.income)}
                      </td>
                      <td className="py-2 px-2 text-right text-red-400">
                        S${formatNumberWithCommas(data.expenses)}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-400">
                        S${formatNumberWithCommas(data.savingsAmount)}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-400">
                        {data.savingsRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {profile.yearlyFinancials.length > 5 && (
                <div className="text-center text-blue-400 text-xs mt-2">
                  Showing last 5 years. Click "Manage Data" to see all {profile.yearlyFinancials.length} years.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {(profile.annualIncome && profile.annualExpenses) && (
        <div className="bg-slate-700/30 rounded-lg p-6">
          <h4 className="font-medium text-white mb-4">Current Year Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">
                S${formatNumberWithCommas(totalIncome)}
              </div>
              <div className="text-xs text-slate-400">Total Income</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">
                S${formatNumberWithCommas(profile.annualExpenses)}
              </div>
              <div className="text-xs text-slate-400">Annual Expenses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {savingsRate.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400">Savings Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Data Manager Modal */}
      {showDataManager && (
        <FinancialDataManager 
          yearlyData={profile.yearlyFinancials}
          onAdd={addNewYear}
          onEdit={editYear}
          onDelete={deleteYear}
          onClose={() => setShowDataManager(false)}
        />
      )}
    </div>
  );
}