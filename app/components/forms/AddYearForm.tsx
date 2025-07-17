'use client';

import { useState } from 'react';
import { EditFormData } from '@/app/lib/types/shared';

interface AddYearFormProps {
  onAdd: (year: number, netWorth: number, annualInvestment: number) => void; 
  onCancel: () => void; 
}

export default function AddYearForm({ onAdd, onCancel }: AddYearFormProps) {
  const [formData, setFormData] = useState<EditFormData>({
    year: new Date().getFullYear().toString(),
    netWorth: '',
    annualInvestment: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(
      parseInt(formData.year),
      parseFloat(formData.netWorth),
      parseFloat(formData.annualInvestment)
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
      
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Add Year
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
  );
}