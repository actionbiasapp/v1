'use client';

import { useState } from 'react';

interface AddYearFormProps {
  onAdd: (year: number, netWorth: number, savings: number) => void;
  onCancel: () => void; 
}

interface EditFormData {
  year: string;
  netWorth: string;
  savings: string;
}

export default function AddYearForm({ onAdd, onCancel }: AddYearFormProps) {
  const [formData, setFormData] = useState<EditFormData>({
    year: new Date().getFullYear().toString(),
    netWorth: '',
    savings: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(
      parseInt(formData.year),
      parseFloat(formData.netWorth),
      parseFloat(formData.savings)
    );
  };

  return (
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
          Add Year
        </button>
      </div>
    </form>
  );
}