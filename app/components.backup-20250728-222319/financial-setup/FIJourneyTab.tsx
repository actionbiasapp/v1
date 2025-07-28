// app/components/financial-setup/FIJourneyTab.tsx
'use client';

import { FinancialProfile } from '@/app/lib/types/financial';

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

interface FIJourneyTabProps {
  profile: FinancialProfile;
  onChange: (updates: Partial<FinancialProfile>) => void;
}

export function FIJourneyTab({ profile, onChange }: FIJourneyTabProps) {
  const handleNumberInput = (field: keyof FinancialProfile, value: string) => {
    const numericValue = parseFormattedNumber(value);
    onChange({ [field]: numericValue });
  };

  const currentNetWorth = 489000;
  const fiTarget = profile.customFIAmount || profile.fiGoal;
  const leanFITarget = profile.leanFIAmount || (fiTarget * 0.74);
  
  const firstMillionProgress = (currentNetWorth / 1000000) * 100;
  const leanFIProgress = (currentNetWorth / leanFITarget) * 100;
  const fullFIProgress = (currentNetWorth / fiTarget) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">FI Journey</h3>
        <p className="text-slate-400 mb-6">
          Define your financial independence goals and track progress across key milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Full FI Target Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              S$
            </span>
            <input
              type="text"
              value={formatNumberWithCommas(profile.customFIAmount || profile.fiGoal)}
              onChange={(e) => handleNumberInput('customFIAmount', e.target.value)}
              placeholder="2,500,000"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Target Year *
          </label>
          <input
            type="number"
            value={profile.customTargetYear || profile.fiTargetYear}
            onChange={(e) => onChange({ customTargetYear: Number(e.target.value) || undefined })}
            placeholder="2032"
            min="2025"
            max="2050"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Lean FI Amount (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              S$
            </span>
            <input
              type="text"
              value={formatNumberWithCommas(profile.leanFIAmount || '')}
              onChange={(e) => handleNumberInput('leanFIAmount', e.target.value)}
              placeholder="1,850,000"
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Geographic arbitrage target (Malaysia, Thailand, etc.)
          </p>
        </div>
      </div>

      {/* Milestone Toggles */}
      <div>
        <h4 className="text-md font-medium text-white mb-4">Track Milestones</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={profile.firstMillionTarget}
              onChange={(e) => onChange({ firstMillionTarget: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-white font-medium">First Million</div>
              <div className="text-xs text-slate-400">Track S$1,000,000</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={profile.leanFITarget}
              onChange={(e) => onChange({ leanFITarget: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-white font-medium">Lean FI</div>
              <div className="text-xs text-slate-400">Geographic arbitrage</div>
            </div>
          </label>

          <div className="flex items-center gap-3 p-3 bg-slate-600 border border-slate-500 rounded-lg opacity-75">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="w-4 h-4 text-blue-600 bg-slate-600 border-slate-500 rounded"
            />
            <div>
              <div className="text-white font-medium">Full FI</div>
              <div className="text-xs text-slate-400">Always tracked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced progress tracking with multiple milestones */}
      <div className="bg-slate-700/30 rounded-lg p-6">
        <h4 className="font-medium text-white mb-4">Milestone Progress</h4>
        
        <div className="space-y-6">
          {/* First Million */}
          {profile.firstMillionTarget && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 flex items-center gap-2">
                  🎯 First Million
                </span>
                <span className="text-white font-medium">
                  S${formatNumberWithCommas(currentNetWorth)} / S$1,000,000
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                  style={{ width: `${Math.min(firstMillionProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{firstMillionProgress.toFixed(1)}% complete</span>
                <span>S${formatNumberWithCommas(1000000 - currentNetWorth)} remaining</span>
              </div>
            </div>
          )}

          {/* Lean FI */}
          {profile.leanFITarget && profile.leanFIAmount && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 flex items-center gap-2">
                  🌴 Lean FI
                </span>
                <span className="text-white font-medium">
                  S${formatNumberWithCommas(currentNetWorth)} / S${formatNumberWithCommas(leanFITarget)}
                </span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700"
                  style={{ width: `${Math.min(leanFIProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{leanFIProgress.toFixed(1)}% complete</span>
                <span>S${formatNumberWithCommas(leanFITarget - currentNetWorth)} remaining</span>
              </div>
            </div>
          )}

          {/* Full FI - Always shown */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 flex items-center gap-2">
                🏆 Full FI
              </span>
              <span className="text-white font-medium">
                S${formatNumberWithCommas(currentNetWorth)} / S${formatNumberWithCommas(fiTarget)}
              </span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700"
                style={{ width: `${Math.min(fullFIProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{fullFIProgress.toFixed(1)}% complete</span>
              <span>S${formatNumberWithCommas(fiTarget - currentNetWorth)} remaining</span>
            </div>
          </div>
        </div>

        {/* Timeline Info */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-400">
                {(profile.customTargetYear || profile.fiTargetYear) - new Date().getFullYear()}
              </div>
              <div className="text-xs text-slate-400">Years to FI Target</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400">
                {profile.customTargetYear || profile.fiTargetYear}
              </div>
              <div className="text-xs text-slate-400">Target Year</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost of Inaction */}
      <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
        <h4 className="font-medium text-red-300 mb-3">💸 Cost of Inaction</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-red-400">⏰</span>
            <span className="text-slate-300">
              Delaying investment by 1 year could cost you S${formatNumberWithCommas(Math.round((fiTarget - currentNetWorth) * 0.07))} 
              in potential returns (7% annual growth assumption)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400">📈</span>
            <span className="text-slate-300">
              At current progress rate, you're {fullFIProgress >= 25 ? 'making good progress' : 'behind schedule'} 
              for your {profile.customTargetYear || profile.fiTargetYear} FI target
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}