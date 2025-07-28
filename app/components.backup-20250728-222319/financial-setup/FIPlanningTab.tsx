// app/components/financial-setup/FIPlanningTab.tsx
// Extracted from FinancialSetupModal.tsx

import { YearlyData } from '@/app/lib/types/shared';

interface FIData {
  goal: number;
  targetYear: number;
}

type TaxStatus = "Employment Pass" | "Citizen" | "PR";

interface UserProfile {
  taxStatus: TaxStatus;
  country: string;
  srsLimit: number;
}

interface FIPlanningTabProps {
  fiData: FIData;
  setFiData: (data: FIData | ((prev: FIData) => FIData)) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  yearlyData: YearlyData[];
  allocationTargets: {
    core: number;
    growth: number;
    hedge: number;
    liquidity: number;
    rebalanceThreshold: number;
  };
  setAllocationTargets: (targets: any) => void;
}

export function FIPlanningTab({ 
  fiData, 
  setFiData, 
  userProfile, 
  setUserProfile, 
  yearlyData, 
  allocationTargets,
  setAllocationTargets
}: FIPlanningTabProps) {
  const currentYear = new Date().getFullYear();
  const currentYearData = yearlyData.find(y => y.year === currentYear);
  const currentNetWorth = currentYearData?.netWorth || 0;
  
  const handleAllocationChange = (key: keyof typeof allocationTargets, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAllocationTargets((prev: typeof allocationTargets) => ({
      ...prev,
      [key]: numValue
    }));
  };

  const yearsToFI = fiData.targetYear - currentYear;
  const requiredSavings = fiData.goal - currentNetWorth;
  const monthlySavingsNeeded = yearsToFI > 0 ? requiredSavings / (yearsToFI * 12) : 0;

  return (
    <div className="space-y-6">
      {/* FI Goal Setting */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Financial Independence Goal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Target Net Worth
            </label>
            <input
              type="number"
              value={fiData.goal}
              onChange={(e) => setFiData(prev => ({ ...prev, goal: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
              min="100000"
              step="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Target Year
            </label>
            <input
              type="number"
              value={fiData.targetYear}
              onChange={(e) => setFiData(prev => ({ ...prev, targetYear: parseInt(e.target.value) || currentYear }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
              min={currentYear}
              max="2100"
            />
          </div>
        </div>
      </div>

      {/* FI Progress Analysis */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Progress Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{yearsToFI}</div>
            <div className="text-sm text-slate-400">Years to FI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              ${requiredSavings.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Additional Savings Needed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              ${Math.round(monthlySavingsNeeded).toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">Monthly Savings Target</div>
          </div>
        </div>
      </div>

      {/* Tax Status Configuration */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Tax Status & SRS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Tax Status
            </label>
            <select
              value={userProfile.taxStatus}
              onChange={(e) => setUserProfile(prev => ({ 
                ...prev, 
                taxStatus: e.target.value as TaxStatus,
                srsLimit: e.target.value === 'Employment Pass' ? 35700 : 15300
              }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Employment Pass">Employment Pass</option>
              <option value="Citizen">Citizen</option>
              <option value="PR">Permanent Resident</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              SRS Limit
            </label>
            <input
              type="number"
              value={userProfile.srsLimit}
              onChange={(e) => setUserProfile(prev => ({ ...prev, srsLimit: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
              min="0"
              step="100"
            />
          </div>
        </div>
      </div>

      {/* Portfolio Allocation Targets */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Allocation Targets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Core (%)
            </label>
            <input
              type="number"
              value={allocationTargets.core}
              onChange={(e) => handleAllocationChange('core', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
              min="0"
              max="100"
              step="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Growth (%)
            </label>
            <input
              type="number"
              value={allocationTargets.growth}
              onChange={(e) => handleAllocationChange('growth', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
              min="0"
              max="100"
              step="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Hedge (%)
            </label>
            <input
              type="number"
              value={allocationTargets.hedge}
              onChange={(e) => handleAllocationChange('hedge', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
              min="0"
              max="100"
              step="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Liquidity (%)
            </label>
            <input
              type="number"
              value={allocationTargets.liquidity}
              onChange={(e) => handleAllocationChange('liquidity', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
              min="0"
              max="100"
              step="5"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Rebalance Threshold (%)
          </label>
          <input
            type="number"
            value={allocationTargets.rebalanceThreshold}
            onChange={(e) => handleAllocationChange('rebalanceThreshold', e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-indigo-500"
            min="1"
            max="20"
            step="1"
          />
        </div>
        
        {/* Allocation Total */}
        <div className="mt-4 p-3 bg-slate-600/50 rounded">
          <div className="text-sm text-slate-400">Total Allocation</div>
          <div className={`text-lg font-semibold ${allocationTargets.core + allocationTargets.growth + allocationTargets.hedge + allocationTargets.liquidity === 100 ? 'text-green-400' : 'text-red-400'}`}>
            {(allocationTargets.core + allocationTargets.growth + allocationTargets.hedge + allocationTargets.liquidity).toFixed(1)}%
          </div>
          {allocationTargets.core + allocationTargets.growth + allocationTargets.hedge + allocationTargets.liquidity !== 100 && (
            <div className="text-xs text-red-400 mt-1">
              Allocation should total 100%
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 