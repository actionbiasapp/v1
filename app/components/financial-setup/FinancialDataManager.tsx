// app/components/financial-setup/FinancialDataManager.tsx
'use client';

import { useState } from 'react';
import { YearlyIncomeExpense } from '@/app/lib/types/financial';
import ActionButtons from '../ui/ActionButtons';

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

interface FinancialDataManagerProps {
  yearlyData: YearlyIncomeExpense[];
  onAdd: (year: number, income: number, expenses: number) => void;
  onEdit: (year: number, income: number, expenses: number) => void;
  onDelete: (year: number) => void;
  onClose: () => void;
}

export function FinancialDataManager({ 
  yearlyData, 
  onAdd,
  onEdit, 
  onDelete, 
  onClose 
}: FinancialDataManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingYear, setEditingYear] = useState<number | null>(null);

  const handleAdd = (year: number, income: number, expenses: number) => {
    onAdd(year, income, expenses);
    setShowAddForm(false);
  };

  const handleEdit = (year: number, income: number, expenses: number) => {
    onEdit(year, income, expenses);
    setEditingYear(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-5xl border border-slate-700 overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
        
        {/* Fixed Header */}
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-white">Manage Financial Data</h3>
              <p className="text-sm text-slate-400 mt-1">Add, edit, or delete yearly income and expense data. Savings rates are automatically calculated.</p>
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
                    <th className="text-right py-3 px-4 font-medium text-slate-300">Income</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-300">Expenses</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-300">Savings</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-300">Rate</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((data) => (
                    <tr key={data.year} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">{data.year}</td>
                      <td className="py-3 px-4 text-right text-blue-400">
                        S${formatNumberWithCommas(data.income)}
                      </td>
                      <td className="py-3 px-4 text-right text-red-400">
                        S${formatNumberWithCommas(data.expenses)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400">
                        S${formatNumberWithCommas(data.savingsAmount)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400">
                        {data.savingsRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <ActionButtons
                            onEdit={() => setEditingYear(data.year)}
                            onDelete={() => onDelete(data.year)}
                            size="sm"
                          />
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
          <FinancialYearForm 
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            title="Add New Year Data"
          />
        )}

        {/* Edit Year Form - Overlaid */}
        {editingYear && (
          <FinancialYearForm 
            initialData={yearlyData.find(d => d.year === editingYear)}
            onSave={handleEdit}
            onCancel={() => setEditingYear(null)}
            title={`Edit ${editingYear} Data`}
          />
        )}
      </div>
    </div>
  );
}

// Financial Year Form Component
function FinancialYearForm({ 
  initialData,
  onSave, 
  onCancel,
  title 
}: { 
  initialData?: YearlyIncomeExpense;
  onSave: (year: number, income: number, expenses: number) => void; 
  onCancel: () => void; 
  title: string;
}) {
  const [formData, setFormData] = useState({
    year: initialData?.year?.toString() || new Date().getFullYear().toString(),
    income: initialData?.income?.toString() || '',
    expenses: initialData?.expenses?.toString() || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      parseInt(formData.year),
      parseFormattedNumber(formData.income),
      parseFormattedNumber(formData.expenses)
    );
  };

  const income = parseFormattedNumber(formData.income);
  const expenses = parseFormattedNumber(formData.expenses);
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Annual Income (S$)</label>
            <input
              type="text"
              value={formData.income}
              onChange={(e) => setFormData({ ...formData, income: e.target.value })}
              placeholder="120,000"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Annual Expenses (S$)</label>
            <input
              type="text"
              value={formData.expenses}
              onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
              placeholder="72,000"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          
          {/* Preview calculations */}
          {income > 0 && expenses > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <div className="text-xs text-slate-400 mb-2">Preview:</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Savings:</span>
                  <div className={`font-medium ${savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    S${formatNumberWithCommas(Math.abs(savings))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Savings Rate:</span>
                  <div className={`font-medium ${savingsRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {savingsRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {initialData ? 'Update Year' : 'Add Year'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}