// app/components/financial-setup/YearEditModal.tsx
// Extracted from FinancialSetupModal.tsx

import { useState } from 'react';
import { YearlyData } from '@/app/lib/types/shared';

interface YearEditModalProps {
  yearData: YearlyData;
  onSave: (data: YearlyData) => void;
  onClose: () => void;
  isEditing: boolean;
  existingYears: number[];
  getSmartDefaults: () => YearlyData;
}

export function YearEditModal({ 
  yearData, 
  onSave, 
  onClose, 
  isEditing, 
  existingYears, 
  getSmartDefaults 
}: YearEditModalProps) {
  const [formData, setFormData] = useState(yearData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) || 0 : parseFloat(value) || 0
    }));
  };

  const handleNetWorthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, netWorth: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate year uniqueness
    if (!isEditing && existingYears.includes(formData.year)) {
      alert('A year with this number already exists!');
      return;
    }
    
    // Calculate savings
    const savings = formData.income - formData.expenses;
    const updatedData = { ...formData, savings };
    
    onSave(updatedData);
  };

  const handleUseDefaults = () => {
    const defaults = getSmartDefaults();
    setFormData(defaults);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {isEditing ? 'Edit Year' : 'Add New Year'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
                min="2000"
                max="2100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Income
              </label>
              <input
                type="number"
                name="income"
                value={formData.income}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
                min="0"
                step="1000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Expenses
              </label>
              <input
                type="number"
                name="expenses"
                value={formData.expenses}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
                min="0"
                step="1000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                SRS Contributions
              </label>
              <input
                type="number"
                name="srsContributions"
                value={formData.srsContributions}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
                min="0"
                step="1000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Net Worth
              </label>
              <input
                type="number"
                name="netWorth"
                value={formData.netWorth}
                onChange={handleNetWorthChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
                min="0"
                step="1000"
                required
              />
            </div>
            
            {/* Calculated Savings Display */}
            <div className="bg-slate-700/50 rounded p-3">
              <div className="text-sm text-slate-400">Calculated Savings</div>
              <div className="text-lg font-semibold text-white">
                ${(formData.income - formData.expenses).toLocaleString()}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleUseDefaults}
                  className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 transition-colors"
                >
                  Use Smart Defaults
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                {isEditing ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 