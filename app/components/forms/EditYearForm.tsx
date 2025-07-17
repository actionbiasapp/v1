'use client';

import { useState } from 'react';
import { YearlyData, EditFormData } from '@/app/lib/types/shared';

interface EditYearFormProps {
  yearlyData: YearlyData[];
  editingYear: number;
  onEdit: (year: number, netWorth: number, annualInvestment: number) => void; 
  onCancel: () => void; 
}

export default function EditYearForm({ 
  yearlyData,
  editingYear,
  onEdit, 
  onCancel 
}: EditYearFormProps) {
  const currentData = yearlyData.find(data => data.year === editingYear);
  const [formData, setFormData] = useState<EditFormData>({
    year: editingYear.toString(),
    netWorth: currentData?.netWorth.toString() || '',
    annualInvestment: currentData?.annualInvestment.toString() || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(
      parseInt(formData.year),
      parseFloat(formData.netWorth),
      parseFloat(formData.annualInvestment)
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Edit {editingYear} Data</h3>
        <p className="text-sm text-slate-400 mb-4">
          Market gains and return percentage will be automatically recalculated.
        </p>
        
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Net Worth ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.netWorth}
              onChange={(e) => setFormData({ ...formData, netWorth: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Annual Investment ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.annualInvestment}
              onChange={(e) => setFormData({ ...formData, annualInvestment: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <div className="text-xs text-slate-400 mb-2">Current calculated values:</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Market Gains:</span>
                <div className={`font-medium ${currentData && currentData.marketGains >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {currentData && (currentData.marketGains >= 0 ? '+' : '')}${currentData?.marketGains.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Return:</span>
                <div className={`font-medium ${currentData && currentData.returnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {currentData && (currentData.returnPercent >= 0 ? '+' : '')}{currentData?.returnPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Update Year
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