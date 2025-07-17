'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FinancialProfile, createDefaultFinancialProfile } from '@/app/lib/types/shared';

interface FinancialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate?: (profile: FinancialProfile) => void;
  initialProfile?: FinancialProfile;
}

interface YearlyData {
  year: number;
  income: number;
  expenses: number;
  savings: number;
  srsContributions: number;
  netWorth: number;
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
  onProfileUpdate
}: FinancialSetupModalProps) {
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [fiData, setFiData] = useState<FIData>({ goal: 2500000, targetYear: 2032 });
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    taxStatus: 'Employment Pass' as TaxStatus, 
    country: 'Singapore', 
    srsLimit: 35700 
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddYear, setShowAddYear] = useState(false);
  const [editingYear, setEditingYear] = useState<YearlyData | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/financial-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setYearlyData(data.yearlyData || []);
          
          if (data.fiData) {
            setFiData({
              goal: data.fiData.goal || 2500000,
              targetYear: data.fiData.targetYear || 2032
            });
          }
          
          if (data.userProfile) {
            setUserProfile({
              taxStatus: (data.userProfile.taxStatus as TaxStatus) || 'Employment Pass',
              country: data.userProfile.country || 'Singapore',
              srsLimit: data.userProfile.srsLimit || 35700
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const saveData = {
        yearlyData,
        fiData,
        userProfile
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
    const currentYearData = yearlyData.find(y => y.year === currentYear);
    
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
    const currentYearData = yearlyData.find(y => y.year === currentYear);
    
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
    const sortedYears = yearlyData.sort((a, b) => b.year - a.year);
    const latestYear = sortedYears[0];
    
    if (!latestYear) {
      return {
        year: currentYear,
        income: 120000,
        expenses: 72000,
        savings: 48000,
        srsContributions: 0,
        netWorth: 350000
      };
    }
    
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
  const currentYearData = yearlyData.find(y => y.year === currentYear);
  const currentNetWorth = currentYearData?.netWorth || 0;
  const fiProgress = (currentNetWorth / fiData.goal) * 100;
  const srsProgress = ((currentYearData?.srsContributions || 0) / userProfile.srsLimit) * 100;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Financial Profile Setup</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="flex border-b border-slate-700">
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

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 0 && (
            <ProfileOverviewTab 
              yearlyData={yearlyData}
              fiData={fiData}
              userProfile={userProfile}
              fiProgress={fiProgress}
              srsProgress={srsProgress}
              currentNetWorth={currentNetWorth}
            />
          )}
          
          {activeTab === 1 && (
            <ManageYearsTab
              yearlyData={yearlyData}
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
              yearlyData={yearlyData}
            />
          )}
        </div>

        <div className="border-t border-slate-700 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {yearlyData.length > 0 && (
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3">📈 Financial Journey ({yearlyData.length} years tracked)</h3>
          <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
            {yearlyData.map((year) => (
              <div key={year.year} className="flex justify-between items-center">
                <span className="text-slate-300">{year.year}</span>
                <div className="flex gap-4 text-xs">
                  <span className="text-blue-400">Income: ${(year.income/1000).toFixed(0)}k</span>
                  <span className="text-emerald-400">Savings: ${(year.savings/1000).toFixed(0)}k</span>
                  <span className="text-purple-400">Net Worth: ${(year.netWorth/1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-white">Financial Data by Year</h3>
        <button
          onClick={() => setShowAddYear(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Add Year
        </button>
      </div>

      {yearlyData.length > 0 ? (
        <div className="space-y-3">
          {yearlyData.map((year) => (
            <div key={year.year} className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-white">{year.year}</h4>
                  {year.year === currentYear && (
                    <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded">Current</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingYear(year)}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteYear(year.year)}
                    className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-slate-400">Income</div>
                  <div className="text-blue-400">S${year.income.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Expenses</div>
                  <div className="text-red-400">S${year.expenses.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Savings</div>
                  <div className="text-emerald-400">S${year.savings.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">SRS</div>
                  <div className="text-yellow-400">S${year.srsContributions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400">Net Worth</div>
                  <div className="text-white">S${year.netWorth.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Savings Rate: {year.income > 0 ? Math.round((year.savings / year.income) * 100) : 0}%
              </div>
            </div>
          ))}
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
        />
      )}
    </div>
  );
}

function FIPlanningTab({ fiData, setFiData, userProfile, setUserProfile, yearlyData }: {
  fiData: FIData;
  setFiData: (data: FIData | ((prev: FIData) => FIData)) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  yearlyData: YearlyData[];
}) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {currentNetWorth > 0 && (
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h3 className="font-medium text-white mb-4">📈 FI Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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

function YearEditModal({ yearData, onSave, onClose, isEditing, existingYears }: {
  yearData: YearlyData;
  onSave: (data: YearlyData) => void;
  onClose: () => void;
  isEditing: boolean;
  existingYears: number[];
}) {
  const [formData, setFormData] = useState(yearData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing && existingYears.includes(formData.year)) {
      alert('Year already exists. Please choose a different year.');
      return;
    }
    
    if (formData.year < 2000 || formData.year > 2030) {
      alert('Please enter a valid year between 2000 and 2030.');
      return;
    }
    
    const savings = formData.income - formData.expenses;
    onSave({ ...formData, savings });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-10">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">
          {isEditing ? `Edit ${formData.year}` : 'Add Year Data'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              required
              disabled={isEditing}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Annual Income (S$)</label>
            <input
              type="number"
              value={formData.income}
              onChange={(e) => setFormData({...formData, income: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Annual Expenses (S$)</label>
            <input
              type="number"
              value={formData.expenses}
              onChange={(e) => setFormData({...formData, expenses: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">SRS Contributions (S$)</label>
            <input
              type="number"
              value={formData.srsContributions}
              onChange={(e) => setFormData({...formData, srsContributions: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Net Worth (S$)</label>
            <input
              type="number"
              value={formData.netWorth}
              onChange={(e) => setFormData({...formData, netWorth: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          
          <div className="bg-slate-700/50 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Calculated Savings</div>
            <div className="text-lg font-bold text-emerald-400">
              S${(formData.income - formData.expenses).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">
              Savings Rate: {formData.income > 0 ? Math.round(((formData.income - formData.expenses) / formData.income) * 100) : 0}%
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? 'Update' : 'Add'} Year
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}