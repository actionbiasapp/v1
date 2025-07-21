'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FinancialProfile, createDefaultFinancialProfile, YearlyData } from '@/app/lib/types/shared';
import { calculateFinancialMetrics } from '@/app/lib/financialUtils';
import FinancialJourneyChart from './FinancialJourneyChart';

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

  const loadProfile = async () => {
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
              srsContributions: Number(d.srs || 0),
              netWorth: Number(d.netWorth || 0),
            }));
            setYearlyData(numericYearlyData);
            setInitialYearlyData(numericYearlyData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
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
        yearlyData: processedYearlyData // Use processed data with calculated gains
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
    const currentYearData = processedYearlyData.find(y => y.year === currentYear);
    
    return {
      annualIncome: currentYearData?.income || 0,
      incomeCurrency: 'SGD',
      taxStatus: userProfile.taxStatus,
      currentSRSContributions: currentYearData?.srsContributions || 0,
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
    const currentYearData = processedYearlyData.find(y => y.year === currentYear);
    
    let completed = 0;
    const fields = [
      currentYearData?.income,
      userProfile.taxStatus,
      currentYearData?.srsContributions !== undefined,
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
    const sortedYears = processedYearlyData.sort((a, b) => b.year - a.year);
    const latestYear = sortedYears[0];
    
    // For the current year, auto-populate net worth from portfolio total
    if (!latestYear || latestYear.year < currentYear) {
      return {
        year: currentYear,
        income: 120000,
        expenses: 72000,
        savings: 48000,
        srsContributions: 0,
        netWorth: portfolioTotal || 350000 // Use portfolio total
      };
    }
    
    // For future years, project based on the latest year's data
    const suggestedYear = Math.max(currentYear, latestYear.year + 1);
    return {
      year: suggestedYear,
      income: Math.round(latestYear.income * 1.05),
      expenses: Math.round(latestYear.expenses * 1.03),
      savings: Math.round(latestYear.income * 1.05) - Math.round(latestYear.expenses * 1.03),
      srsContributions: 0,
      netWorth: Math.round(latestYear.netWorth * 1.15)
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

  const tabs = ['📊 Profile Overview', '📅 Manage Years', '🎯 FI Planning'];
  const currentYear = new Date().getFullYear();
  const currentYearData = processedYearlyData.find(y => y.year === currentYear);
  const currentNetWorth = currentYearData?.netWorth || 0;
  const fiProgress = (currentNetWorth / fiData.goal) * 100;
  const srsProgress = ((currentYearData?.srsContributions || 0) / (userProfile.srsLimit || 1)) * 100;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Financial Profile Setup</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">✕</button>
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

        {/* Mobile Dropdown */}
        <div className="sm:hidden p-2 border-b border-slate-700">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(Number(e.target.value))}
            className="w-full bg-slate-700 text-white p-2 rounded-md border border-slate-600"
          >
            {tabs.map((tab, index) => (
              <option key={index} value={index}>{tab}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 0 && (
            <ProfileOverviewTab 
              yearlyData={processedYearlyData}
              fiData={fiData}
              userProfile={userProfile}
              fiProgress={fiProgress}
              srsProgress={srsProgress}
              currentNetWorth={currentNetWorth}
            />
          )}
          
          {activeTab === 1 && (
            <ManageYearsTab
              yearlyData={processedYearlyData}
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
            <FIPlanningTab
              fiData={fiData}
              setFiData={setFiData}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              yearlyData={processedYearlyData}
              allocationTargets={allocationTargets}
              setAllocationTargets={setAllocationTargets}
            />
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

function ProfileOverviewTab({ yearlyData, fiData, userProfile, fiProgress, srsProgress, currentNetWorth }: {
  yearlyData: YearlyData[];
  fiData: FIData;
  userProfile: UserProfile;
  fiProgress: number;
  srsProgress: number;
  currentNetWorth: number;
}) {
  const currentYear = new Date().getFullYear();
  const currentYearData = yearlyData.find((y) => y.year === currentYear);
  const previousYearData = yearlyData.find((y) => y.year === currentYear - 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">CURRENT INCOME ({currentYear})</div>
          <div className="text-2xl font-bold text-white">S${(currentYearData?.income || 0).toLocaleString()}</div>
          <div className="text-xs text-slate-400">{userProfile.taxStatus}</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">NET WORTH</div>
          <div className="text-2xl font-bold text-emerald-400">S${currentNetWorth.toLocaleString()}</div>
          <div className="text-xs text-slate-400">
            {previousYearData && currentYearData ? 
              `${((currentYearData.netWorth - previousYearData.netWorth) / previousYearData.netWorth * 100).toFixed(1)}% growth` 
              : 'Current portfolio value'
            }
          </div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">SAVINGS RATE</div>
          <div className="text-2xl font-bold text-blue-400">
            {currentYearData ? Math.round(((currentYearData.income - currentYearData.expenses) / currentYearData.income) * 100) : 40}%
          </div>
          <div className="text-xs text-slate-400">Annual savings rate</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">FI Progress</span>
            <span className="text-white">{fiProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-3">
            <div 
              className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(fiProgress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            S${(fiData.goal - currentNetWorth).toLocaleString()} to FI goal by {fiData.targetYear}
          </div>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">SRS Contributions {currentYear}</span>
            <span className="text-white">{srsProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-3">
            <div 
              className="h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(srsProgress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            S${(currentYearData?.srsContributions || 0).toLocaleString()} of S${userProfile.srsLimit.toLocaleString()} limit
          </div>
        </div>
      </div>

      <FinancialJourneyChart yearlyData={yearlyData} />
    </div>
  );
}

function ManageYearsTab({ 
  yearlyData, showAddYear, setShowAddYear, editingYear, setEditingYear,
  addYear, updateYear, deleteYear, getSmartDefaults 
}: {
  yearlyData: YearlyData[];
  showAddYear: boolean;
  setShowAddYear: (show: boolean) => void;
  editingYear: YearlyData | null;
  setEditingYear: (year: YearlyData | null) => void;
  addYear: (year: YearlyData) => void;
  updateYear: (year: YearlyData) => void;
  deleteYear: (year: number) => void;
  getSmartDefaults: () => YearlyData;
}) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof YearlyData; direction: 'ascending' | 'descending' }>({ key: 'year', direction: 'descending' });

  const sortedYearlyData = useMemo(() => {
    let sortableItems = [...yearlyData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if ((a[sortConfig.key] ?? 0) < (b[sortConfig.key] ?? 0)) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if ((a[sortConfig.key] ?? 0) > (b[sortConfig.key] ?? 0)) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [yearlyData, sortConfig]);

  const requestSort = (key: keyof YearlyData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: keyof YearlyData) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h3 className="font-medium text-white">Financial Data by Year</h3>
        <button
          onClick={() => setShowAddYear(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Add Year
        </button>
      </div>

      {yearlyData.length > 0 ? (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {/* Desktop Table */}
          <table className="hidden sm:table w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-400 cursor-pointer" onClick={() => requestSort('year')}>Year{getSortIndicator('year')}</th>
                <th className="text-right py-3 px-4 font-medium text-slate-400 cursor-pointer" onClick={() => requestSort('income')}>Income{getSortIndicator('income')}</th>
                <th className="text-right py-3 px-4 font-medium text-slate-400 cursor-pointer" onClick={() => requestSort('expenses')}>Expenses{getSortIndicator('expenses')}</th>
                <th className="text-right py-3 px-4 font-medium text-slate-400 cursor-pointer" onClick={() => requestSort('savings')}>Savings{getSortIndicator('savings')}</th>
                <th className="text-right py-3 px-4 font-medium text-slate-400 cursor-pointer" onClick={() => requestSort('marketGains')}>Gains{getSortIndicator('marketGains')}</th>
                <th className="text-right py-3 px-4 font-medium text-slate-400 cursor-pointer" onClick={() => requestSort('netWorth')}>Net Worth{getSortIndicator('netWorth')}</th>
                <th className="text-center py-3 px-4 font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedYearlyData.map((year) => (
                <tr key={year.year} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-white">{year.year}</td>
                  <td className="py-3 px-4 text-right text-cyan-400">S${(year.income ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-red-400">S${(year.expenses ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-indigo-400">
                    S${(year.savings ?? 0).toLocaleString()} <span className="text-xs text-slate-400">({(year.savingsRate ?? 0).toFixed(0)}%)</span>
                  </td>
                  <td className={`py-3 px-4 text-right ${(year.marketGains ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(year.marketGains ?? 0) >= 0 ? '+' : ''}S${(year.marketGains ?? 0).toLocaleString()} <span className="text-xs text-slate-400">({(year.returnPercent ?? 0).toFixed(1)}%)</span>
                  </td>
                  <td className="py-3 px-4 text-right text-white">S${(year.netWorth ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setEditingYear(year)}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteYear(year.year)}
                      className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4 px-4">
            {sortedYearlyData.map((year) => (
              <div key={year.year} className="bg-slate-700/40 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold text-lg text-white">{year.year}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingYear(year)}
                      className="text-xs px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteYear(year.year)}
                      className="text-xs px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-slate-400">Income</div>
                  <div className="text-right text-cyan-400">S${(year.income ?? 0).toLocaleString()}</div>
                  <div className="text-slate-400">Expenses</div>
                  <div className="text-right text-red-400">S${(year.expenses ?? 0).toLocaleString()}</div>
                  <div className="text-slate-400">Savings</div>
                  <div className="text-right text-indigo-400">
                    S${(year.savings ?? 0).toLocaleString()} <span className="text-xs text-slate-500">({(year.savingsRate ?? 0).toFixed(0)}%)</span>
                  </div>
                  <div className="text-slate-400">Gains</div>
                  <div className={`text-right ${(year.marketGains ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(year.marketGains ?? 0) >= 0 ? '+' : ''}S${(year.marketGains ?? 0).toLocaleString()} <span className="text-xs text-slate-500">({(year.returnPercent ?? 0).toFixed(1)}%)</span>
                  </div>
                  <div className="text-slate-400 font-semibold">Net Worth</div>
                  <div className="text-right text-white font-semibold">S${(year.netWorth ?? 0).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="text-slate-400 text-center py-8">
          <div className="text-lg mb-2">📊</div>
          <div>No financial data yet. Add years to track your journey.</div>
          <button
            onClick={() => setShowAddYear(true)}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Your First Year
          </button>
        </div>
      )}

      {(showAddYear || editingYear) && (
        <YearEditModal
          yearData={editingYear || getSmartDefaults()}
          onSave={editingYear ? updateYear : addYear}
          onClose={() => {
            setShowAddYear(false);
            setEditingYear(null);
          }}
          isEditing={!!editingYear}
          existingYears={yearlyData.map((y) => y.year)}
          getSmartDefaults={getSmartDefaults}
        />
      )}
    </div>
  );
}

function FIPlanningTab({ 
  fiData, 
  setFiData, 
  userProfile, 
  setUserProfile, 
  yearlyData, 
  allocationTargets,
  setAllocationTargets
}: {
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
}) {
  const handleAllocationChange = (key: keyof typeof allocationTargets, value: string) => {
    const numericValue = Number(value);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      setAllocationTargets((prev: any) => ({ ...prev, [key]: numericValue }));
    }
  };

  const { core, growth, hedge, liquidity } = allocationTargets;
  const totalAllocation = core + growth + hedge + liquidity;

  const currentYear = new Date().getFullYear();
  const currentYearData = yearlyData.find((y) => y.year === currentYear);
  const currentNetWorth = currentYearData?.netWorth || 0;
  
  const yearsToFI = fiData.targetYear - currentYear;
  const requiredAnnualGrowth = currentNetWorth > 0 ? 
    Math.pow(fiData.goal / currentNetWorth, 1 / yearsToFI) - 1 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="font-medium text-white mb-4">🎯 Financial Independence Goal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">FI Goal (S$)</label>
            <input
              type="number"
              value={fiData.goal}
              onChange={(e) => setFiData(prev => ({...prev, goal: Number(e.target.value)}))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="2500000"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Target Year</label>
            <input
              type="number"
              value={fiData.targetYear}
              onChange={(e) => setFiData(prev => ({...prev, targetYear: Number(e.target.value)}))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="2032"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="font-medium text-white mb-4">🏛️ Tax Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tax Status</label>
            <select
              value={userProfile.taxStatus}
              onChange={(e) => setUserProfile(prev => ({...prev, taxStatus: e.target.value as TaxStatus}))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            >
              <option value="Employment Pass">Employment Pass</option>
              <option value="Citizen">Citizen</option>
              <option value="PR">Permanent Resident</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">SRS Limit (S$)</label>
            <input
              type="number"
              value={userProfile.srsLimit}
              onChange={(e) => setUserProfile(prev => ({...prev, srsLimit: Number(e.target.value)}))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="35700"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="font-medium text-white mb-4">📊 Allocation Targets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['core', 'growth', 'hedge', 'liquidity'] as const).map((key) => (
            <div key={key}>
              <label className="block text-sm text-slate-300 mb-1 capitalize">{key}</label>
              <div className="relative">
                <input
                  type="number"
                  value={allocationTargets[key]}
                  onChange={(e) => handleAllocationChange(key, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </div>
          ))}
        </div>
        <div className={`mt-3 text-sm font-medium ${totalAllocation !== 100 ? 'text-red-400' : 'text-green-400'}`}>
          Total: {totalAllocation}% {totalAllocation !== 100 && `(${(100 - totalAllocation).toFixed(0)}% remaining)`}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50">
           <label className="block text-sm text-slate-300 mb-1">Rebalance Threshold</label>
           <div className="relative max-w-xs">
             <input
                type="number"
                value={allocationTargets.rebalanceThreshold}
                onChange={(e) => handleAllocationChange('rebalanceThreshold', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
           </div>
           <p className="text-xs text-slate-400 mt-1">
              Rebalance when allocation differs by this amount.
            </p>
        </div>
      </div>

      {currentNetWorth > 0 && (
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-medium text-white mb-4">📈 FI Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400">Years to FI</div>
              <div className="text-2xl font-bold text-blue-400">{yearsToFI}</div>
            </div>
            <div>
              <div className="text-slate-400">Required Annual Growth</div>
              <div className="text-2xl font-bold text-emerald-400">{(requiredAnnualGrowth * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-slate-400">Progress</div>
              <div className="text-2xl font-bold text-purple-400">{((currentNetWorth / fiData.goal) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function YearEditModal({ yearData, onSave, onClose, isEditing, existingYears, getSmartDefaults }: {
  yearData: YearlyData;
  onSave: (data: YearlyData) => void;
  onClose: () => void;
  isEditing: boolean;
  existingYears: number[];
  getSmartDefaults: () => YearlyData;
}) {
  const [formData, setFormData] = useState(() => {
    const defaults = getSmartDefaults();
    const isCurrentYear = yearData.year === new Date().getFullYear();
    const calculatedSavings = yearData.income - yearData.expenses;
    return {
      year: yearData.year.toString(),
      income: yearData.income?.toString() || '',
      expenses: yearData.expenses?.toString() || '',
      savings: (yearData.savings ?? calculatedSavings)?.toString() || '',
      srsContributions: yearData.srsContributions?.toString() || '',
      netWorth: (isCurrentYear && !isEditing ? defaults.netWorth : yearData.netWorth)?.toString() || ''
    };
  });
  const [showWarning, setShowWarning] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleNetWorthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isCurrentYear = parseInt(formData.year) === new Date().getFullYear();
    if (isCurrentYear) {
      setShowWarning(true);
    }
    handleChange(e);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing && existingYears.includes(parseInt(formData.year))) {
      alert('Year already exists. Please choose a different year.');
      return;
    }
    
    if (parseInt(formData.year) < 2000 || parseInt(formData.year) > 2030) {
      alert('Please enter a valid year between 2000 and 2030.');
      return;
    }
    
    const numericData = {
      year: parseInt(formData.year),
      income: parseFloat(formData.income) || 0,
      expenses: parseFloat(formData.expenses) || 0,
      savings: parseFloat(formData.savings) || 0,
      srsContributions: parseFloat(formData.srsContributions) || 0,
      netWorth: parseFloat(formData.netWorth) || 0,
    };
    onSave(numericData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-10">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">
          {isEditing ? `Edit ${formData.year}` : 'Add Year Data'}
        </h3>
        {!isEditing && (
          <p className="text-sm text-slate-400 mb-4">
            Smart defaults have been pre-filled based on your last entry. Adjust as needed.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Year</label>
            <input
              name="year"
              type="number"
              value={formData.year}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white"
              required
              disabled={isEditing}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Annual Income (S$)</label>
            <input
              name="income"
              type="number"
              value={formData.income}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Annual Expenses (S$)</label>
            <input
              name="expenses"
              type="number"
              value={formData.expenses}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
           <div>
            <label className="block text-sm text-slate-400 mb-1">Savings (S$)</label>
            <input
              name="savings"
              type="number"
              value={formData.savings}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">SRS Contributions (S$)</label>
            <input
              name="srsContributions"
              type="number"
              value={formData.srsContributions}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Net Worth (S$)</label>
            <input
              name="netWorth"
              type="number"
              value={formData.netWorth}
              onChange={handleNetWorthChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
            {showWarning && (
              <p className="text-xs text-amber-400 mt-1">
                Note: You are manually overriding the live portfolio value for the current year.
              </p>
            )}
          </div>
          
          <div className="bg-slate-700/50 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Calculated Savings Rate</div>
            <div className="text-lg font-bold text-emerald-400">
              {parseFloat(formData.income) > 0 ? Math.round(((parseFloat(formData.income) - parseFloat(formData.expenses)) / parseFloat(formData.income)) * 100) : 0}%
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-medium"
            >
              {isEditing ? 'Update' : 'Add'} Year
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}