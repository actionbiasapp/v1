'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FinancialProfile, createDefaultFinancialProfile, YearlyData, MonthlySnapshot } from '@/app/lib/types/shared';
import { calculateFinancialMetrics } from '@/app/lib/financialUtils';
import { CardLoader } from '@/app/components/ui/Loader';
import ActionButtons from '../ui/ActionButtons';
import { ProfileOverviewTab } from './ProfileOverviewTab';
import { ManageYearsTab } from './ManageYearsTab';
import { FIPlanningAndMilestonesTab } from './FIPlanningAndMilestonesTab';
import { MonthlySnapshotsTab } from './MonthlySnapshotsTab';

interface FinancialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate?: (profile: FinancialProfile) => void;
  initialProfile?: FinancialProfile;
  portfolioTotal?: number;
  allocationTargets?: {
    core: number;
    growth: number;
    hedge: number;
    liquidity: number;
    rebalanceThreshold: number;
  };
}

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

export default function FinancialSetupModal({ 
  isOpen, 
  onClose, 
  onProfileUpdate,
  portfolioTotal,
  allocationTargets: initialAllocationTargets
}: FinancialSetupModalProps) {
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshot[]>([]);
  const [fiData, setFiData] = useState<FIData>({ goal: 2500000, targetYear: 2032 });
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    taxStatus: 'Employment Pass' as TaxStatus, 
    country: 'Singapore', 
    srsLimit: 35700 
  });
  const [allocationTargets, setAllocationTargets] = useState(initialAllocationTargets || {
    core: 25,
    growth: 55,
    hedge: 10,
    liquidity: 10,
    rebalanceThreshold: 5,
  });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddYear, setShowAddYear] = useState(false);
  const [editingYear, setEditingYear] = useState<YearlyData | null>(null);
  
  // States for dirty check
  const [initialYearlyData, setInitialYearlyData] = useState<YearlyData[]>([]);
  const [initialFiData, setInitialFiData] = useState<FIData>({ goal: 2500000, targetYear: 2032 });
  const [initialUserProfile, setInitialUserProfile] = useState<UserProfile>({ 
    taxStatus: 'Employment Pass' as TaxStatus, 
    country: 'Singapore', 
    srsLimit: 35700 
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      loadMilestones();
      loadMonthlySnapshots();
    }
  }, [isOpen]);

  // Check for unsaved changes
  useEffect(() => {
    if (!isOpen) return;
    
    const yearlyDataChanged = JSON.stringify(yearlyData) !== JSON.stringify(initialYearlyData);
    const fiDataChanged = JSON.stringify(fiData) !== JSON.stringify(initialFiData);
    const userProfileChanged = JSON.stringify(userProfile) !== JSON.stringify(initialUserProfile);
    
    setIsDirty(yearlyDataChanged || fiDataChanged || userProfileChanged);
  }, [yearlyData, fiData, userProfile, initialYearlyData, initialFiData, initialUserProfile, isOpen]);

  const processedYearlyData = useMemo(() => {
    return calculateFinancialMetrics(yearlyData);
  }, [yearlyData]);

  // Always use live portfolio value for current year's net worth
  const currentYear = new Date().getFullYear();
  const updatedYearlyData = useMemo(() => {
    return processedYearlyData.map((y) =>
      y.year === currentYear && portfolioTotal
        ? { ...y, netWorth: portfolioTotal }
        : y
    );
  }, [processedYearlyData, portfolioTotal]);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await fetch('/api/financial-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.profile) {
            const loadedFiData = {
              goal: data.profile.fiGoal || 2500000,
              targetYear: data.profile.fiTargetYear || 2032
            };
            const loadedUserProfile = {
              taxStatus: (data.profile.taxStatus as TaxStatus) || 'Employment Pass',
              country: data.profile.country || 'Singapore',
              srsLimit: data.profile.srsLimit || 35700
            };
            setFiData(loadedFiData);
            setInitialFiData(loadedFiData);
            setUserProfile(loadedUserProfile);
            setInitialUserProfile(loadedUserProfile);
          }

          if (data.yearlyData) {
            const numericYearlyData = data.yearlyData.map((d: any) => ({
              year: Number(d.year || 0),
              income: Number(d.income || 0),
              expenses: Number(d.expenses || 0),
              savings: Number(d.savings || 0),
              srs: Number(d.srs || 0),
              netWorth: Number(d.netWorth || 0),
            }));
            setYearlyData(numericYearlyData);
            setInitialYearlyData(numericYearlyData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const loadMilestones = async () => {
    try {
      const response = await fetch('/api/fi-milestones');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMilestones(data.milestones || []);
        }
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  };

  const loadMonthlySnapshots = async () => {
    try {
      const response = await fetch('/api/monthly-snapshot');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMonthlySnapshots(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load monthly snapshots:', error);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      // Reshape the data to match the API's expected structure
      const profile = {
        taxStatus: userProfile.taxStatus,
        country: userProfile.country,
        srsLimit: userProfile.srsLimit,
        fiGoal: fiData.goal,
        fiTargetYear: fiData.targetYear,
        ...allocationTargets, // Combine allocation targets into profile
      };

      const saveData = {
        profile,
        yearlyData: updatedYearlyData // Use processed data with calculated gains
      };

      const response = await fetch('/api/financial-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const computedProfile = computeProfileFromUnifiedData();
          onProfileUpdate?.(computedProfile);
          setIsDirty(false); // Reset dirty state on successful save
          onClose();
        } else {
          alert(`Failed to save: ${result.error || 'Unknown error'}`);
        }
      } else {
        const errorData = await response.text();
        alert(`Save failed: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed: Network error');
    } finally {
      setLoading(false);
    }
  };

  const computeProfileFromUnifiedData = (): FinancialProfile => {
    const currentYear = new Date().getFullYear();
    const currentYearData = updatedYearlyData.find(y => y.year === currentYear);
    
    return {
      annualIncome: currentYearData?.income || 0,
      incomeCurrency: 'SGD',
      taxStatus: userProfile.taxStatus,
              currentSRSContributions: currentYearData?.srs || 0,
      fiGoal: fiData.goal,
      fiTargetYear: fiData.targetYear,
      firstMillionTarget: true,
      bonusIncome: undefined,
      coreTarget: 25,
      growthTarget: 55,
      hedgeTarget: 10,
      liquidityTarget: 10,
      rebalanceThreshold: 5,
      profileCompleteness: calculateCompleteness(),
      srsAutoOptimize: true
    };
  };

  const calculateCompleteness = (): number => {
    const currentYear = new Date().getFullYear();
    const currentYearData = updatedYearlyData.find(y => y.year === currentYear);
    
    let completed = 0;
    const fields = [
      currentYearData?.income,
      userProfile.taxStatus,
              currentYearData?.srs !== undefined,
      fiData.goal,
      fiData.targetYear
    ];
    
    fields.forEach(field => {
      if (field !== undefined && field !== null && field !== 0) completed++;
    });
    
    return Math.round((completed / fields.length) * 100);
  };

  const getSmartDefaults = (): YearlyData => {
    const currentYear = new Date().getFullYear();
    const sortedYears = updatedYearlyData.sort((a, b) => b.year - a.year);
    const latestYear = sortedYears[0];
    
    // For the current year, auto-populate net worth from portfolio total
    if (!latestYear || latestYear.year < currentYear) {
      return {
        id: `default-${currentYear}`,
        year: currentYear,
        income: 120000,
        expenses: 72000,
        savings: 48000,
        srs: 0,
        netWorth: portfolioTotal || 350000, // Use portfolio total
        marketGains: 0,
        returnPercent: 0,
        savingsRate: 40,
        isEstimated: true,
        confidence: 'low',
        notes: 'Auto-generated default data',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // For future years, project based on the latest year's data
    const suggestedYear = Math.max(currentYear, latestYear.year + 1);
    return {
      id: `projected-${suggestedYear}`,
      year: suggestedYear,
      income: Math.round(latestYear.income * 1.05),
      expenses: Math.round(latestYear.expenses * 1.03),
      savings: Math.round(latestYear.income * 1.05) - Math.round(latestYear.expenses * 1.03),
      srs: 0,
      netWorth: Math.round(latestYear.netWorth * 1.15),
      marketGains: 0,
      returnPercent: 0,
      savingsRate: 40,
      isEstimated: true,
      confidence: 'low',
      notes: 'Projected data based on previous year',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  };

  const addYear = (yearData: YearlyData) => {
    setYearlyData(prev => [...prev, yearData].sort((a, b) => b.year - a.year));
    setShowAddYear(false);
    setEditingYear(null);
  };

  const updateYear = (yearData: YearlyData) => {
    setYearlyData(prev => prev.map(y => y.year === yearData.year ? yearData : y));
    setEditingYear(null);
  };

  const deleteYear = (year: number) => {
    if (confirm(`Delete data for ${year}?`)) {
      setYearlyData(prev => prev.filter(y => y.year !== year));
    }
  };

  if (!isOpen) return null;

  const tabs = ['📊 Profile Overview', '📅 Manage Years', '🎯 FI Planning & Milestones', '📈 Monthly Snapshots'];
  const currentYearData = updatedYearlyData.find(y => y.year === currentYear);
  const currentNetWorth = currentYearData?.netWorth || 0;
  const fiProgress = (currentNetWorth / fiData.goal) * 100;
  const srsProgress = ((currentYearData?.srs || 0) / (userProfile.srsLimit || 1)) * 100;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleClose} style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div className="bg-slate-800 rounded-t-2xl sm:rounded-2xl border border-slate-700 w-full h-[90vh] sm:h-auto sm:max-w-4xl sm:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Financial Profile</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden border-b border-slate-700">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
              disabled={activeTab === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex-1 text-center px-4">
              <div className="text-white font-medium text-sm">{tabs[activeTab].split(' ').slice(1).join(' ')}</div>
              <div className="text-slate-400 text-xs mt-1">{activeTab + 1} of {tabs.length}</div>
            </div>
            
            <button
              onClick={() => setActiveTab(Math.min(tabs.length - 1, activeTab + 1))}
              disabled={activeTab === tabs.length - 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Tab Indicators */}
          <div className="flex justify-center px-4 pb-4">
            {tabs.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 mx-1 rounded-full transition-all duration-300 ${
                  index === activeTab 
                    ? 'bg-blue-500' 
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex border-b border-slate-700">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex-1 p-3 text-sm font-medium transition-colors ${
                activeTab === index 
                  ? 'text-white bg-slate-700/50 border-b-2 border-blue-500' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {profileLoading ? (
            <CardLoader className="my-8" />
          ) : (
            <>
              {activeTab === 0 && (
                <ProfileOverviewTab 
                  yearlyData={updatedYearlyData}
                  monthlySnapshots={monthlySnapshots}
                  fiData={fiData}
                  userProfile={userProfile}
                  fiProgress={fiProgress}
                  srsProgress={srsProgress}
                  currentNetWorth={currentNetWorth}
                />
              )}
              
              {activeTab === 1 && (
                <ManageYearsTab
                  yearlyData={updatedYearlyData}
                  showAddYear={showAddYear}
                  setShowAddYear={setShowAddYear}
                  editingYear={editingYear}
                  setEditingYear={setEditingYear}
                  addYear={addYear}
                  updateYear={updateYear}
                  deleteYear={deleteYear}
                  getSmartDefaults={getSmartDefaults}
                />
              )}

              {activeTab === 2 && (
                <FIPlanningAndMilestonesTab
                  fiData={fiData}
                  setFiData={setFiData}
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  yearlyData={updatedYearlyData}
                  allocationTargets={allocationTargets}
                  setAllocationTargets={setAllocationTargets}
                  milestones={milestones}
                  onMilestonesChange={setMilestones}
                />
              )}
              
              {activeTab === 3 && (
                <MonthlySnapshotsTab
                  portfolioTotal={portfolioTotal}
                  displayCurrency="SGD"
                  yearlyData={updatedYearlyData}
                />
              )}
            </>
          )}
        </div>

        <div className="border-t border-slate-700 p-4 flex justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 text-slate-400 hover:text-white">
            Cancel
          </button>
          <button 
            onClick={saveProfile}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}







