'use client';

import { useState } from 'react';
import { FIPlanningTab } from './FIPlanningTab';
import { FIMilestonesTab } from './FIMilestonesTab';

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

interface FIPlanningAndMilestonesTabProps {
  fiData: FIData;
  setFiData: (data: FIData | ((prev: FIData) => FIData)) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  yearlyData: YearlyData[];
  allocationTargets: { core: number; growth: number; hedge: number; liquidity: number; rebalanceThreshold: number };
  setAllocationTargets: (targets: any) => void;
  milestones: any[];
  onMilestonesChange: (milestones: any[]) => void;
}

export function FIPlanningAndMilestonesTab({
  fiData,
  setFiData,
  userProfile,
  setUserProfile,
  yearlyData,
  allocationTargets,
  setAllocationTargets,
  milestones,
  onMilestonesChange
}: FIPlanningAndMilestonesTabProps) {
  const [activeSection, setActiveSection] = useState<'planning' | 'milestones'>('planning');

  return (
    <div className="space-y-6">
      {/* Section Toggle */}
      <div className="flex bg-slate-700/50 rounded-lg p-1">
        <button
          onClick={() => setActiveSection('planning')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'planning'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          FI Planning
        </button>
        <button
          onClick={() => setActiveSection('milestones')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'milestones'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          FI Milestones
        </button>
      </div>

      {/* Content */}
      {activeSection === 'planning' ? (
        <FIPlanningTab
          fiData={fiData}
          setFiData={setFiData}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          yearlyData={yearlyData}
          allocationTargets={allocationTargets}
          setAllocationTargets={setAllocationTargets}
        />
      ) : (
        <FIMilestonesTab
          milestones={milestones}
          onMilestonesChange={onMilestonesChange}
        />
      )}
    </div>
  );
} 