// app/components/financial-setup/ProfileOverviewTab.tsx
// Extracted from FinancialSetupModal.tsx

import { YearlyData, MonthlySnapshot } from '@/app/lib/types/shared';
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
  monthlySnapshots?: MonthlySnapshot[];
  fiData: FIData;
  userProfile: UserProfile;
  fiProgress: number;
  srsProgress: number;
  currentNetWorth: number;
}

export function ProfileOverviewTab({ 
  yearlyData, 
  monthlySnapshots = [],
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
      {/* Financial Journey Chart - The Hero */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <FinancialJourneyChart yearlyData={yearlyData} monthlySnapshots={monthlySnapshots} />
      </div>
    </div>
  );
} 