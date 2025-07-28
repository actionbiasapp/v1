// app/components/financial-setup/ManageYearsTab.tsx
// Extracted from FinancialSetupModal.tsx

import { useState } from 'react';
import { YearlyData } from '@/app/lib/types/shared';
import { YearEditModal } from './YearEditModal';

interface ManageYearsTabProps {
  yearlyData: YearlyData[];
  showAddYear: boolean;
  setShowAddYear: (show: boolean) => void;
  editingYear: YearlyData | null;
  setEditingYear: (year: YearlyData | null) => void;
  addYear: (year: YearlyData) => void;
  updateYear: (year: YearlyData) => void;
  deleteYear: (year: number) => void;
  getSmartDefaults: () => YearlyData;
}

type SortKey = keyof YearlyData;
type SortDirection = 'asc' | 'desc';

export function ManageYearsTab({ 
  yearlyData, 
  showAddYear, 
  setShowAddYear, 
  editingYear, 
  setEditingYear,
  addYear, 
  updateYear, 
  deleteYear, 
  getSmartDefaults 
}: ManageYearsTabProps) {
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const requestSort = (key: keyof YearlyData) => {
    const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(direction);
  };

  const getSortIndicator = (key: keyof YearlyData) => {
    if (sortKey !== key) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const sortedData = [...yearlyData].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });

  const existingYears = yearlyData.map(y => y.year);

  // Calculate gains and returns for display
  const getGainData = (yearData: YearlyData) => {
    const marketGains = yearData.marketGains || 0;
    const returnPercent = yearData.returnPercent || 0;
    const isPositive = marketGains >= 0;
    
    return {
      marketGains,
      returnPercent,
      isPositive
    };
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button - Apple-style */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">Financial Journey</h3>
          <p className="text-sm text-gray-400 mt-1">Track your yearly progress and performance</p>
        </div>
        <button
          onClick={() => setShowAddYear(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Year
        </button>
      </div>

      {/* Table - Apple-style design */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-700/30">
              <tr>
                <th 
                  className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors"
                  onClick={() => requestSort('year')}
                >
                  <div className="flex items-center gap-2">
                    Year
                    <span className="text-gray-500">{getSortIndicator('year')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors"
                  onClick={() => requestSort('income')}
                >
                  <div className="flex items-center gap-2">
                    Income
                    <span className="text-gray-500">{getSortIndicator('income')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors"
                  onClick={() => requestSort('expenses')}
                >
                  <div className="flex items-center gap-2">
                    Expenses
                    <span className="text-gray-500">{getSortIndicator('expenses')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors"
                  onClick={() => requestSort('savings')}
                >
                  <div className="flex items-center gap-2">
                    Savings
                    <span className="text-gray-500">{getSortIndicator('savings')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors"
                  onClick={() => requestSort('marketGains')}
                >
                  <div className="flex items-center gap-2">
                    Gains
                    <span className="text-gray-500">{getSortIndicator('marketGains')}</span>
                  </div>
                </th>
                                  <th 
                    className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/30 transition-colors"
                    onClick={() => requestSort('netWorth')}
                  >
                    <div className="flex items-center gap-2">
                      Net Worth
                      <span className="text-gray-500">{getSortIndicator('netWorth')}</span>
                    </div>
                  </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {sortedData.map((yearData) => {
                const gainData = getGainData(yearData);
                return (
                  <tr key={yearData.year} className="hover:bg-gray-700/20 transition-colors">
                                         <td className="px-4 py-4 text-sm text-white font-medium">
                       {yearData.year}
                     </td>
                                         <td className="px-4 py-4 text-sm text-white">
                       ${Math.round(yearData.income / 1000)}k
                     </td>
                     <td className="px-4 py-4 text-sm text-white">
                       ${Math.round(yearData.expenses / 1000)}k
                     </td>
                     <td className="px-4 py-4 text-sm text-white">
                       ${Math.round(yearData.savings / 1000)}k
                     </td>
                     <td className="px-4 py-4 text-sm">
                       <div className="flex flex-col">
                         <span className={`font-medium ${gainData.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                           {gainData.isPositive ? '+' : ''}${Math.round(gainData.marketGains / 1000)}k
                         </span>
                         <span className={`text-xs ${gainData.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                           {gainData.isPositive ? '+' : ''}{gainData.returnPercent.toFixed(1)}%
                         </span>
                       </div>
                     </td>
                     <td className="px-4 py-4 text-sm text-white font-semibold">
                       ${Math.round(yearData.netWorth / 1000)}k
                     </td>
                                         <td className="px-4 py-4 text-sm text-white">
                       <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditingYear(yearData)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-600 rounded-lg transition-all duration-200"
                          title="Edit year"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteYear(yearData.year)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600 rounded-lg transition-all duration-200"
                          title="Delete year"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>



      {/* Empty State - Apple-style */}
      {yearlyData.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No financial data yet</h3>
          <p className="text-gray-400 mb-6">Start tracking your financial journey by adding your first year</p>
          <button
            onClick={() => setShowAddYear(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            Add Your First Year
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddYear && (
        <YearEditModal
          yearData={getSmartDefaults()}
          onSave={addYear}
          onClose={() => setShowAddYear(false)}
          isEditing={false}
          existingYears={existingYears}
          getSmartDefaults={getSmartDefaults}
        />
      )}

      {editingYear && (
        <YearEditModal
          yearData={editingYear}
          onSave={updateYear}
          onClose={() => setEditingYear(null)}
          isEditing={true}
          existingYears={existingYears.filter(y => y !== editingYear.year)}
          getSmartDefaults={getSmartDefaults}
        />
      )}
    </div>
  );
} 