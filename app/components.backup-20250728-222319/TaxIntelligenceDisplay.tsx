'use client';

interface TaxIntelligence {
  srsOptimization?: {
    remainingRoom?: number;
    taxSavings?: number;
    daysToDeadline?: number;
    monthlyTarget?: number;
    urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
    maxContribution?: number;
    currentContributions?: number;
    taxBracket?: number;
  };
  opportunityCost?: {
    monthlyPotentialSavings?: number;
    actionMessage?: string;
    urgencyMessage?: string;
  };
  employmentPassAdvantage?: {
    srsLimitAdvantage?: number;
    additionalTaxSavings?: number;
    vsComparison?: string;
  };
}

interface TaxIntelligenceDisplayProps {
  taxIntelligence?: TaxIntelligence;
  isLoading?: boolean;
}

export default function TaxIntelligenceDisplay({ 
  taxIntelligence, 
  isLoading = false 
}: TaxIntelligenceDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Singapore Tax Optimization</h2>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Employment Pass Analysis</span>
          </div>
        </div>
        
        <div className="text-center text-gray-400">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
          <p>Loading tax intelligence...</p>
        </div>
      </div>
    );
  }

  if (!taxIntelligence) {
    return null;
  }

  const srs = taxIntelligence.srsOptimization;
  const advantage = taxIntelligence.employmentPassAdvantage;
  const opportunity = taxIntelligence.opportunityCost;

  // Calculate progress percentage
  const contributionProgress = srs?.maxContribution ? 
    ((srs.currentContributions || 0) / srs.maxContribution) * 100 : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Singapore Tax Optimization</h2>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Employment Pass Analysis</span>
        </div>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">SRS OPPORTUNITY</div>
          <div className="text-2xl font-bold text-emerald-400">
            ${srs?.taxSavings?.toLocaleString() || '6,426'}
          </div>
          <div className="text-xs text-gray-400">Tax savings potential</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">EMPLOYMENT PASS ADVANTAGE</div>
          <div className="text-2xl font-bold text-blue-400">
            ${advantage?.additionalTaxSavings?.toLocaleString() || '3,726'}
          </div>
          <div className="text-xs text-gray-400">vs Citizens/PRs</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">MONTHLY TARGET</div>
          <div className="text-2xl font-bold text-yellow-400">
            ${srs?.monthlyTarget?.toLocaleString() || '2,975'}
          </div>
          <div className="text-xs text-gray-400">To maximize by Dec 31</div>
        </div>
      </div>
      
      {/* SRS Progress Bar */}
      <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">SRS Contribution Progress</span>
          <span className="text-sm text-gray-400">
            {srs?.daysToDeadline || 175} days remaining
          </span>
        </div>
        
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${contributionProgress}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-gray-400 mt-1">
          ${(srs?.currentContributions || 0).toLocaleString()} contributed of ${srs?.maxContribution?.toLocaleString() || '35,700'} limit
        </div>
        
        {/* Urgency indicator */}
        {srs?.urgencyLevel && (
          <div className={`text-xs mt-2 px-2 py-1 rounded-full inline-block ${
            srs.urgencyLevel === 'critical' ? 'bg-red-900/30 text-red-300' :
            srs.urgencyLevel === 'high' ? 'bg-orange-900/30 text-orange-300' :
            srs.urgencyLevel === 'medium' ? 'bg-yellow-900/30 text-yellow-300' :
            'bg-green-900/30 text-green-300'
          }`}>
            {srs.urgencyLevel.toUpperCase()} PRIORITY
          </div>
        )}
      </div>
      
      {/* Opportunity Cost Warning */}
      {opportunity && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span className="text-sm font-medium text-yellow-400">Opportunity Cost Alert</span>
          </div>
          <p className="text-sm text-yellow-300 mb-1">{opportunity.actionMessage}</p>
          <p className="text-xs text-yellow-400">
            Missing ${opportunity.monthlyPotentialSavings?.toLocaleString() || '708'}/month in potential savings
          </p>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
          Setup SRS Contributions
        </button>
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
          Learn Employment Pass Benefits
        </button>
      </div>
    </div>
  );
}