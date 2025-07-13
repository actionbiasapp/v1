'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FinancialProfile, createDefaultFinancialProfile } from '@/app/lib/types/shared';

const DEFAULT_PROFILE: FinancialProfile = createDefaultFinancialProfile();

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

export default function FinancialSetupModal({ 
  isOpen, 
  onClose, 
  onProfileUpdate,
  initialProfile 
}: FinancialSetupModalProps) {
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_PROFILE);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddYear, setShowAddYear] = useState(false);
  const [editingYear, setEditingYear] = useState<YearlyData | null>(null);

  // Load existing profile
  useEffect(() => {
    console.log("🔍 Modal useEffect - isOpen:", isOpen, "initialProfile:", initialProfile);    if (isOpen) {
      if (initialProfile) {
        setProfile(initialProfile);
      loadProfile(); // Also load yearlyData even when initialProfile exists
      } else {
        loadProfile();
      }
    }
  }, [isOpen, initialProfile]);

  const loadProfile = async () => {
    console.log("📞 loadProfile() CALLED - about to fetch /api/financial-profile");    try {
      const response = await fetch('/api/financial-profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const loadedProfile: FinancialProfile = {
            annualIncome: data.data.income,
            incomeCurrency: 'SGD',
            taxStatus: data.data.taxStatus,
            currentSRSContributions: data.data.srsContributions,
            fiGoal: data.data.fiTarget,
            fiTargetYear: data.data.fiYear,
            firstMillionTarget: data.data.firstMillionTarget,
            bonusIncome: undefined,
            otherIncome: undefined,
            coreTarget: 25,
            growthTarget: 55,
            hedgeTarget: 10,
            liquidityTarget: 10,
            rebalanceThreshold: 5,
            profileCompleteness: calculateCompleteness(data.data),
            srsAutoOptimize: true,
            customFIAmount: undefined,
            customTargetYear: undefined
          };
          setProfile(loadedProfile);
          setYearlyData(data.yearlyData || []);
          console.log('🔄 Setting yearlyData state:', data.yearlyData);
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
        data: {
          income: profile.annualIncome || 120000,
          incomeCurrency: profile.incomeCurrency || 'SGD',
          taxStatus: profile.taxStatus || 'Employment Pass',
          srsContributions: profile.currentSRSContributions || 0,
          expenses: yearlyData.find(y => y.year === new Date().getFullYear())?.expenses || 72000,          fiTarget: profile.fiGoal || 2500000,
          fiYear: profile.fiTargetYear || 2032,
          srsAutoOptimize: profile.srsAutoOptimize !== false,
          firstMillionTarget: profile.firstMillionTarget !== false,
          bonusIncome: profile.bonusIncome,
          otherIncome: profile.otherIncome,
          customFIAmount: profile.customFIAmount,
          customTargetYear: profile.customTargetYear,
          coreTarget: profile.coreTarget || 25,
          growthTarget: profile.growthTarget || 55,
          hedgeTarget: profile.hedgeTarget || 10,
          liquidityTarget: profile.liquidityTarget || 10,
          rebalanceThreshold: profile.rebalanceThreshold || 5,
          profileCompleteness: calculateCompleteness()
        },
        yearlyData: yearlyData
      };

      const response = await fetch('/api/financial-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onProfileUpdate?.(profile);
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

  const calculateCompleteness = (data?: any): number => {
    if (!data) {
      // Fallback to profile state if no data provided
      let completed = 0;
      const fields = [
        profile.annualIncome,
        profile.taxStatus,
        profile.currentSRSContributions !== undefined,
        profile.fiGoal,
        profile.fiTargetYear
      ];
      
      fields.forEach(field => {
        if (field !== undefined && field !== null && field !== 0) completed++;
      });
      
      return Math.round((completed / fields.length) * 100);
    }
    
    // Use API data when provided
    let completed = 0;
    const fields = [
      data.income,
      data.taxStatus,
      data.srsContributions !== undefined,
      data.fiTarget,
      data.fiYear
    ];
    
    fields.forEach(field => {
      if (field !== undefined && field !== null && field !== 0) completed++;
    });
    
    return Math.round((completed / fields.length) * 100);
  };
  // Current year detection and smart prepopulation
  const getCurrentYear = () => new Date().getFullYear();
  
  const getSmartDefaults = (): YearlyData => {
    const currentYear = getCurrentYear();
    const lastYear = yearlyData.sort((a, b) => b.year - a.year)[0];
    
    if (!lastYear) {
      return {
        year: currentYear - 1,
        income: profile.annualIncome || 120000,
        expenses: 72000,
        savings: (profile.annualIncome || 120000) - 72000,
        srsContributions: 0,
        netWorth: 350000
      };
    }
    
    return {
      year: lastYear.year - 1,
      income: Math.round(lastYear.income * 1.05), // 5% growth
      expenses: Math.round(lastYear.expenses * 1.03), // 3% inflation
      savings: Math.round(lastYear.income * 1.05) - Math.round(lastYear.expenses * 1.03),
      srsContributions: 0,
      netWorth: Math.round(lastYear.netWorth * 0.9) // Conservative estimate
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

  const tabs = ['📊 Profile', '⚙️ Manage Data'];
  const srsMax = profile.taxStatus === 'Employment Pass' ? 35700 : 15000;
  const currentNetWorth = yearlyData[0]?.netWorth || (profile.annualIncome || 120000) * 4;
  const fiProgress = (currentNetWorth / (profile.fiGoal || 2500000)) * 100;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Financial Setup</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Tabs */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 0 && (
            <ProfileTab 
              profile={profile}
              yearlyData={yearlyData}
              fiProgress={fiProgress}
              srsMax={srsMax}
              currentNetWorth={currentNetWorth}
            />
          )}
          
          {activeTab === 1 && (
            <ManageDataTab
              yearlyData={yearlyData}
              showAddYear={showAddYear}
              setShowAddYear={setShowAddYear}
              editingYear={editingYear}
              setEditingYear={setEditingYear}
              addYear={addYear}
              updateYear={updateYear}
              deleteYear={deleteYear}
              getSmartDefaults={getSmartDefaults}
              profile={profile}
              setProfile={setProfile}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">
            Cancel
          </button>
          <button 
            onClick={saveProfile}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// PROFILE TAB - Data Display + Intelligence
function ProfileTab({ profile, yearlyData, fiProgress, srsMax, currentNetWorth }: any) {
  const currentYear = new Date().getFullYear();
  const currentYearData = yearlyData.find((y: any) => y.year === currentYear);
  const srsProgress = ((profile.currentSRSContributions || 0) / srsMax) * 100;

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">ANNUAL INCOME</div>
          <div className="text-2xl font-bold text-white">S${(profile.annualIncome || 0).toLocaleString()}</div>
          <div className="text-xs text-slate-400">{profile.taxStatus}</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">NET WORTH</div>
          <div className="text-2xl font-bold text-emerald-400">S${currentNetWorth.toLocaleString()}</div>
          <div className="text-xs text-slate-400">Current portfolio value</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1">SAVINGS RATE</div>
          <div className="text-2xl font-bold text-blue-400">
            {currentYearData ? Math.round(((currentYearData.income - currentYearData.expenses) / currentYearData.income) * 100) : 40}%
          </div>
          <div className="text-xs text-slate-400">Annual savings rate</div>
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="space-y-4">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">FI Progress</span>
            <span className="text-white">{fiProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-3">
            <div 
              className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{ width: `${Math.min(fiProgress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            S${((profile.fiGoal || 2500000) - currentNetWorth).toLocaleString()} to FI goal
          </div>
        </div>

        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-300">SRS Contributions {currentYear}</span>
            <span className="text-white">{srsProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-3">
            <div 
              className="h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
              style={{ width: `${Math.min(srsProgress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">
            S${(profile.currentSRSContributions || 0).toLocaleString()} of S${srsMax.toLocaleString()} limit
          </div>
        </div>
      </div>

      {/* Portfolio Intelligence Integration */}
      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="font-medium text-white mb-3">💡 Portfolio Intelligence</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-slate-300">Tax-efficient allocation on track</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⚠</span>
            <span className="text-slate-300">Consider increasing SRS contributions by S${(srsMax - (profile.currentSRSContributions || 0)).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">ℹ</span>
            <span className="text-slate-300">On track for {profile.fiTargetYear || 2032} FI target</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// MANAGE DATA TAB - CRUD Operations
function ManageDataTab({ 
  yearlyData, showAddYear, setShowAddYear, editingYear, setEditingYear,
  addYear, updateYear, deleteYear, getSmartDefaults, profile, setProfile 
}: any) {
  return (
    <div className="space-y-4">
      {/* Current Year Quick Edit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Annual Income (S$)</label>
          <input
            type="number"
            value={profile.annualIncome || ''}
            onChange={(e) => setProfile((prev: any) => ({...prev, annualIncome: Number(e.target.value) || undefined}))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            placeholder="120000"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">SRS Contributions 2025 (S$)</label>
          <input
            type="number"
            value={profile.currentSRSContributions || ''}
            onChange={(e) => setProfile((prev: any) => ({...prev, currentSRSContributions: Number(e.target.value) || 0}))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">FI Target (S$)</label>
          <input
            type="number"
            value={profile.fiGoal || ''}
            onChange={(e) => setProfile((prev: any) => ({...prev, fiGoal: Number(e.target.value) || 2500000}))}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            placeholder="2500000"
          />
        </div>
      </div>

      {/* Yearly Data Management */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-white">Historical Financial Data</h3>
        <button
          onClick={() => setShowAddYear(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Add Year
        </button>
      </div>

      {yearlyData.length > 0 ? (
        <div className="space-y-3">
          {yearlyData.map((year: any) => (
            <div key={year.year} className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-white">{year.year}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingYear(year)}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteYear(year.year)}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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
            </div>
          ))}
        </div>
      ) : (
        <div className="text-slate-400 text-center py-8">
          No historical data yet. Add years to track your financial journey.
        </div>
      )}

      {/* Add/Edit Year Modal */}
      {(showAddYear || editingYear) && (
        <YearEditModal
          yearData={editingYear || getSmartDefaults()}
          onSave={editingYear ? updateYear : addYear}
          onClose={() => {
            setShowAddYear(false);
            setEditingYear(null);
          }}
          isEditing={!!editingYear}
        />
      )}
    </div>
  );
}

// Year Edit Modal Component
function YearEditModal({ yearData, onSave, onClose, isEditing }: any) {
  const [formData, setFormData] = useState(yearData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savings = formData.income - formData.expenses;
    onSave({ ...formData, savings });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">
          {isEditing ? `Edit ${formData.year}` : 'Add Year Data'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Income (S$)</label>
            <input
              type="number"
              value={formData.income}
              onChange={(e) => setFormData({...formData, income: Number(e.target.value)})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Expenses (S$)</label>
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
          
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? 'Update' : 'Add'} Year
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
