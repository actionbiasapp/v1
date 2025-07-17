'use client';

import { useState } from 'react';
import { YearlyData } from '@/app/lib/types/shared';
import AddYearForm from '@/app/components/forms/AddYearForm';

interface NetWorthDataManagerProps {
  yearlyData: YearlyData[];
  onAdd: (year: number, netWorth: number, annualInvestment: number) => void;
  onEdit: (year: number) => void;
  onDelete: (year: number) => void;
  onClose: () => void;
}

export default function NetWorthDataManager({ 
  yearlyData, 
  onAdd,
  onEdit, 
  onDelete, 
  onClose 
}: NetWorthDataManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = (year: number, netWorth: number, annualInvestment: number) => {
    onAdd(year, netWorth, annualInvestment);
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-5xl border border-slate-700 overflow-hidden flex flex-col" style={{ maxHeight: '85vh', height: 'auto' }}>
        
        {/* Fixed Header */}
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-white">Manage Net Worth Data</h3>
              <p className="text-sm text-slate-400 mt-1">Add, edit, or delete yearly data points. Market gains and returns are automatically recalculated.</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-4"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18"/>
                <path d="M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          {/* Add Year Button */}
          <div className="mt-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
              Add New Year
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: '300px', maxHeight: '50vh' }}>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-300">Year</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-300">Net Worth</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-300">Investment</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-300">Market Gains</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-300">Return %</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((data) => (
                    <tr key={data.year} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">
                        {data.year === 2025 ? `${data.year}*` : data.year}
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        ${data.netWorth.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-400">
                        ${data.annualInvestment.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        data.marketGains >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {data.marketGains >= 0 ? '+' : ''}${data.marketGains.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${
                        data.returnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {data.returnPercent >= 0 ? '+' : ''}{data.returnPercent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => onEdit(data.year)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"/>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => onDelete(data.year)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18"/>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>

        {/* Add Year Form - Overlaid */}
        {showAddForm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Add New Year Data</h3>
              
              <AddYearForm 
                onAdd={handleAdd}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}