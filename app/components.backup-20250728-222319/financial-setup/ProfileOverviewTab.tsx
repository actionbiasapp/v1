// app/components/financial-setup/ProfileOverviewTab.tsx
// Extracted from FinancialSetupModal.tsx

import { YearlyData } from '@/app/lib/types/shared';
import FinancialJourneyChart from './FinancialJourneyChart';

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

interface ProfileOverviewTabProps {
  yearlyData: YearlyData[];
  fiData: FIData;
  userProfile: UserProfile;
  fiProgress: number;
  srsProgress: number;
  currentNetWorth: number;
}

export function ProfileOverviewTab({ 
  yearlyData, 
  fiData, 
  userProfile, 
  fiProgress, 
  srsProgress, 
  currentNetWorth 
}: ProfileOverviewTabProps) {
  const currentYear = new Date().getFullYear();
  const currentYearData = yearlyData.find(y => y.year === currentYear);
  
  return (
    <div className="space-y-6">
      {/* Financial Journey Chart */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Financial Journey</h3>
        <FinancialJourneyChart yearlyData={yearlyData} />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Net Worth */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm font-medium">Current Net Worth</div>
          <div className="text-2xl font-bold text-white">
            ${currentNetWorth.toLocaleString()}
          </div>
          <div className="text-slate-400 text-xs mt-1">
            Updated recently
          </div>
        </div>

        {/* FI Progress */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm font-medium">FI Progress</div>
          <div className="text-2xl font-bold text-white">
            {fiProgress.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(fiProgress, 100)}%` }}
            ></div>
          </div>
          <div className="text-slate-400 text-xs mt-1">
            ${currentNetWorth.toLocaleString()} / ${fiData.goal.toLocaleString()}
          </div>
        </div>

        {/* SRS Progress */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm font-medium">SRS Contributions</div>
          <div className="text-2xl font-bold text-white">
            {srsProgress.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(srsProgress, 100)}%` }}
            ></div>
          </div>
          <div className="text-slate-400 text-xs mt-1">
            ${currentYearData?.srsContributions || 0} / ${userProfile.srsLimit}
          </div>
        </div>

        {/* Tax Status */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm font-medium">Tax Status</div>
          <div className="text-lg font-semibold text-white">
            {userProfile.taxStatus}
          </div>
          <div className="text-slate-400 text-xs mt-1">
            {userProfile.country}
          </div>
          <div className="text-slate-400 text-xs">
            SRS Limit: ${userProfile.srsLimit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Current Year Summary */}
      {currentYearData && (
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">{currentYear} Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-slate-400 text-sm">Income</div>
              <div className="text-xl font-semibold text-white">
                ${currentYearData.income.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Expenses</div>
              <div className="text-xl font-semibold text-white">
                ${currentYearData.expenses.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Savings Rate</div>
              <div className="text-xl font-semibold text-white">
                {currentYearData.income > 0 ? ((currentYearData.income - currentYearData.expenses) / currentYearData.income * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 