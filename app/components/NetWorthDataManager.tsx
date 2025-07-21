'use client';

import { useState } from 'react';
import { YearlyData } from '@/app/lib/types/shared';
import AddYearForm from '@/app/components/forms/AddYearForm';
import EditYearForm from '@/app/components/forms/EditYearForm';

interface NetWorthDataManagerProps {
  yearlyData: YearlyData[];
  onAdd: (year: number, netWorth: number, savings: number) => void;
  onEdit: (year: number, netWorth: number, savings: number) => void;
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
  const [editingYear, setEditingYear] = useState<YearlyData | null>(null);

  const handleAdd = (year: number, netWorth: number, savings: number) => {
    onAdd(year, netWorth, savings);
    setShowAddForm(false);
  };

  const handleEdit = (year: number, netWorth: number, savings: number) => {
    onEdit(year, netWorth, savings);
    setEditingYear(null);
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
                    <th className="text-right py-3 px-4 font-medium text-slate-300">Savings</th>
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
                      <td className="py-3 px-4 text-right text-emerald-400">
                        ${data.savings?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          className="text-blue-400 hover:text-blue-600 mr-2"
                          onClick={() => setEditingYear(data)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                        </button>
                        <button
                          className="text-red-400 hover:text-red-600"
                          onClick={() => onDelete(data.year)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18"/>
                            <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/>
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                          </svg>
                        </button>
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

        {/* Add Year Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <AddYearForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
          </div>
        )}
        {/* Edit Year Form Modal */}
        {editingYear && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <EditYearForm
              yearlyData={yearlyData}
              editingYear={editingYear.year}
              onEdit={handleEdit}
              onCancel={() => setEditingYear(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}