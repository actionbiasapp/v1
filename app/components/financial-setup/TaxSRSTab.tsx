// app/components/financial-setup/TaxSRSTab.tsx
'use client';

import { FinancialProfile } from '@/app/lib/types/financial';
import { calculateSRSOptimization } from '@/app/lib/singaporeTax';

const formatNumberWithCommas = (value: number | string): string => {
  if (!value && value !== 0) return '';
  const numStr = value.toString().replace(/,/g, '');
  const num = parseFloat(numStr);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
};

const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

interface TaxSRSTabProps {
  profile: FinancialProfile;
  onChange: (updates: Partial<FinancialProfile>) => void;
}

export function TaxSRSTab({ profile, onChange }: TaxSRSTabProps) {
  const maxSRS = profile.taxStatus === 'Employment Pass' ? 35700 : 15000;
  const remaining = maxSRS - (profile.currentSRSContributions || 0);

  const handleNumberInput = (field: keyof FinancialProfile, value: string) => {
    const numericValue = parseFormattedNumber(value);
    onChange({ [field]: numericValue });
  };

  // Use existing tax intelligence system
  const taxIntelligence = profile.annualIncome ? 
    calculateSRSOptimization(profile.annualIncome, profile.currentSRSContributions || 0, profile.taxStatus) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Tax & SRS Optimization</h3>
        <p className="text-slate-400 mb-6">
          Maximize your Singapore tax benefits and SRS contributions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Tax Status *
          </label>
          <select
            value={profile.taxStatus || 'Employment Pass'}
            onChange={(e) => onChange({ taxStatus: e.target.value as any })}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Employment Pass">Employment Pass</option>
            <option value="Citizen">Citizen</option>
            <option value="PR">Permanent Resident</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Current SRS Contributions (2025) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              S$
            </span>
            <input
              type="text"
              value={formatNumberWithCommas(profile.currentSRSContributions || '')}
              onChange={(e) => handleNumberInput('currentSRSContributions', e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-700/30 rounded-lg p-6">
        <h4 className="font-medium text-white mb-4">2025 SRS Progress</h4>
        
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              S${formatNumberWithCommas(profile.currentSRSContributions || 0)}
            </div>
            <div className="text-xs text-slate-400">Contributed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              S${formatNumberWithCommas(remaining)}
            </div>
            <div className="text-xs text-slate-400">Remaining Room</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              S${formatNumberWithCommas(Math.round(taxIntelligence?.taxSavings || 0))}
            </div>
            <div className="text-xs text-slate-400">
              {profile.annualIncome ? 'Est. Tax Savings' : 'Tax Savings (Add Income)'}
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${Math.min(((profile.currentSRSContributions || 0) / maxSRS) * 100, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>S$0</span>
          <span>S${formatNumberWithCommas(maxSRS)} ({profile.taxStatus})</span>
        </div>
      </div>

      {/* Enhanced tax optimization using existing intelligence */}
      {profile.annualIncome && remaining > 0 && taxIntelligence && (
        <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-lg p-4">
          <h4 className="font-medium text-emerald-300 mb-3">🎯 Tax Optimization Opportunity</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Monthly Target:</span>
              <span className="ml-2 text-white font-medium">S${formatNumberWithCommas(Math.round(taxIntelligence.monthlyTarget))}</span>
            </div>
            <div>
              <span className="text-slate-400">Days Remaining:</span>
              <span className="ml-2 text-white font-medium">{taxIntelligence.urgencyDays}</span>
            </div>
            <div>
              <span className="text-slate-400">Potential Tax Savings:</span>
              <span className="ml-2 text-emerald-400 font-medium">
                S${formatNumberWithCommas(Math.round(taxIntelligence.taxSavings))}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Net Cost After Tax:</span>
              <span className="ml-2 text-blue-400 font-medium">
                S${formatNumberWithCommas(Math.round(taxIntelligence.netCost))}
              </span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-emerald-800/20 rounded-lg">
            <p className="text-emerald-200 text-sm">
              💡 <strong>Action:</strong> Contributing S${formatNumberWithCommas(Math.round(taxIntelligence.monthlyTarget))}/month 
              will save you S${formatNumberWithCommas(Math.round(taxIntelligence.taxSavings))} in taxes by Dec 31.
            </p>
          </div>
        </div>
      )}

      {profile.taxStatus === 'Employment Pass' && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
          <h4 className="font-medium text-blue-300 mb-3">🇸🇬 Employment Pass Advantage</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-blue-400">💰</span>
              <span className="text-slate-300">
                <strong>SRS Limit:</strong> S$35,700 vs S$15,000 for Citizens/PRs 
                (S$20,700 additional room)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">🏛️</span>
              <span className="text-slate-300">
                <strong>No CPF:</strong> More take-home income available for investment
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}