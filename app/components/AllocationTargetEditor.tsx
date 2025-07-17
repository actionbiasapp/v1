// app/components/AllocationTargetEditor.tsx - Mobile-first allocation editor
'use client';

import { useState, useEffect } from 'react';

interface AllocationTargets {
  core: number;
  growth: number;
  hedge: number;
  liquidity: number;
  rebalanceThreshold: number;
}

interface AllocationTargetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargets: AllocationTargets;
  onTargetsUpdate: (targets: AllocationTargets) => void;
}

export default function AllocationTargetEditor({
  isOpen,
  onClose,
  currentTargets,
  onTargetsUpdate
}: AllocationTargetEditorProps) {
  const [targets, setTargets] = useState<AllocationTargets>(currentTargets);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when props change
  useEffect(() => {
    setTargets(currentTargets);
  }, [currentTargets]);

  // Calculate total and validation
  const total = targets.core + targets.growth + targets.hedge + targets.liquidity;
  const isValid = Math.abs(total - 100) < 0.01;
  const totalError = Math.abs(total - 100) > 0.01;

  const handleInputChange = (field: keyof AllocationTargets, value: string) => {
    const numValue = Math.max(0, Math.min(100, Number(value) || 0));
    setTargets(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSave = async () => {
    if (!isValid) {
      setError('Allocation must total exactly 100%');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/financial-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allocationTargets: targets
        })
      });

      const data = await response.json();

      if (data.success) {
        onTargetsUpdate(targets);
        onClose();
      } else {
        setError(data.error || 'Failed to update allocation targets');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Failed to update allocation targets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTargets({
      core: 25,
      growth: 55,
      hedge: 10,
      liquidity: 10,
      rebalanceThreshold: 5
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Edit Allocation Targets
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Core Allocation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Core Allocation
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={targets.core}
                onChange={(e) => handleInputChange('core', e.target.value)}
                className="w-full h-12 px-4 pr-8 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>

          {/* Growth Allocation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Growth Allocation
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={targets.growth}
                onChange={(e) => handleInputChange('growth', e.target.value)}
                className="w-full h-12 px-4 pr-8 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>

          {/* Hedge Allocation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Hedge Allocation
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={targets.hedge}
                onChange={(e) => handleInputChange('hedge', e.target.value)}
                className="w-full h-12 px-4 pr-8 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>

          {/* Liquidity Allocation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Liquidity Allocation
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={targets.liquidity}
                onChange={(e) => handleInputChange('liquidity', e.target.value)}
                className="w-full h-12 px-4 pr-8 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
          </div>

          {/* Rebalance Threshold */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Rebalance Threshold
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="20"
                step="0.1"
                value={targets.rebalanceThreshold}
                onChange={(e) => handleInputChange('rebalanceThreshold', e.target.value)}
                className="w-full h-12 px-4 pr-8 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Rebalance when allocation differs by this amount
            </p>
          </div>

          {/* Total Display */}
          <div className={`p-3 rounded-lg border ${
            totalError ? 'bg-red-900/20 border-red-500/50' : 'bg-green-900/20 border-green-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Total:</span>
              <span className={`text-lg font-semibold ${
                totalError ? 'text-red-400' : 'text-green-400'
              }`}>
                {total.toFixed(1)}%
              </span>
            </div>
            {totalError && (
              <p className="text-xs text-red-400 mt-1">
                Must equal 100% (currently {total > 100 ? 'over' : 'under'} by {Math.abs(total - 100).toFixed(1)}%)
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            Reset to Default
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={!isValid || isLoading}
              className={`px-6 py-2 h-12 rounded-lg font-medium transition-colors min-w-[80px] ${
                isValid && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}