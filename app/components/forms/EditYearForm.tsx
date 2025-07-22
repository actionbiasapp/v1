'use client';

import { useState } from 'react';

interface EditYearFormProps {
  yearlyData: any[];
  editingYear: number;
  onEdit: (year: number, netWorth: number, savings: number) => void;
  onCancel: () => void; 
}

interface EditFormData {
  year: string;
  netWorth: string;
  savings: string;
}

export default function EditYearForm({ yearlyData, editingYear, onEdit, onCancel }: EditYearFormProps) {
  const currentData = yearlyData.find(data => data.year === editingYear);
  const [formData, setFormData] = useState<EditFormData>({
    year: editingYear.toString(),
    netWorth: currentData?.netWorth?.toString() || '',
    savings: currentData?.savings?.toString() || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(
      parseInt(formData.year),
      parseFloat(formData.netWorth),
      parseFloat(formData.savings)
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
              disabled
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Savings ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.savings}
              onChange={(e) => setFormData({ ...formData, savings: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}