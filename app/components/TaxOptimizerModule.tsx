'use client';

import { useState } from 'react';

interface TaxIntelligence {
  srsOptimization: {
    remainingRoom: number;
    taxSavings: number;
    daysToDeadline: number;
    monthlyTarget: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    currentContributions: number;
    maxContribution: number;
  };
  opportunityCost: {
    monthlyPotentialSavings: number;
    actionMessage: string;
    urgencyMessage: string;
  };
  employmentPassAdvantage: {
    srsLimitAdvantage: number;
    additionalTaxSavings: number;
    vsComparison: string;
  };
}

interface TaxOptimizerModuleProps {
  taxIntelligence?: TaxIntelligence;
  loading?: boolean;
}

export default function TaxOptimizerModule({ 
  taxIntelligence, 
  loading = false 
}: TaxOptimizerModuleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  // Fallback data for graceful degradation
  const defaultTaxIntel = {
    srsOptimization: {
      remainingRoom: 35700,
      taxSavings: 4105,
      daysToDeadline: 175,
      monthlyTarget: 1200,
      urgencyLevel: 'medium' as const,
      currentContributions: 0,
      maxContribution: 35700
    },
    opportunityCost: {
      monthlyPotentialSavings: 342,
      actionMessage: "Start monthly SRS to capture benefits",
      urgencyMessage: "Missing potential tax savings each month"
    },
    employmentPassAdvantage: {
      srsLimitAdvantage: 20700,
      additionalTaxSavings: 2415,
      vsComparison: "$2,415 more tax savings vs Citizens/PRs"
    }
  };
  
  const intel = taxIntelligence || defaultTaxIntel;
  const srs = intel.srsOptimization;
  const cost = intel.opportunityCost;
  const advantage = intel.employmentPassAdvantage;
  
  const getUrgencyStyles = (level: string) => {
    switch (level) {
      case 'critical': return 'border-red-500/30 bg-red-900/10 text-red-300';
      case 'high': return 'border-orange-500/30 bg-orange-900/10 text-orange-300';
      case 'medium': return 'border-yellow-500/30 bg-yellow-900/10 text-yellow-300';
      default: return 'border-green-500/30 bg-green-900/10 text-green-300';
    }
  };
  
  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📅';
      default: return '✅';
    }
  };
  
  const progressPercentage = srs.maxContribution > 0 
    ? ((srs.maxContribution - srs.remainingRoom) / srs.maxContribution) * 100 
    : 0;

  const handleSRSAction = () => {
    setLocalLoading(true);
    // TODO: Implement SRS contribution action
    setTimeout(() => {
      setLocalLoading(false);
      alert('SRS contribution setup would be implemented here');
    }, 1000);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-200">Tax Optimization</h2>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Employment Pass Benefits</span>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {/* Always Visible Header */}
        <div 
          className="p-6 cursor-pointer hover:bg-gray-700/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <h3 className="text-lg font-semibold text-white">SRS Tax Optimization</h3>
              {loading && (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`
                text-xs px-3 py-1 rounded-full font-medium uppercase tracking-wide
                ${getUrgencyStyles(srs.urgencyLevel)}
              `}>
                {getUrgencyIcon(srs.urgencyLevel)} {srs.urgencyLevel}
              </span>
              <span className="text-gray-400 text-sm">
                {isExpanded ? '▲' : '▼'}
              </span>
            </div>
          </div>
          
          {/* Key Metrics - Always Visible */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Remaining Room</div>
              <div className="text-2xl font-bold text-white">
                ${srs.remainingRoom?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-gray-500">of ${srs.maxContribution?.toLocaleString()} limit</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Potential Savings</div>
              <div className="text-2xl font-bold text-emerald-400">
                ${srs.taxSavings?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-gray-500">in tax reduction</div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Monthly Target</div>
              <div className="text-2xl font-bold text-blue-400">
                ${srs.monthlyTarget?.toFixed(0) || '0'}
              </div>
              <div className="text-xs text-gray-500">{srs.daysToDeadline} days left</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>SRS Progress</span>
              <span>{progressPercentage.toFixed(1)}% contributed</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="h-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Opportunity Cost Message */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-300">
              {cost.urgencyMessage || "Missing potential tax savings each month"}
            </p>
          </div>
        </div>
        
        {/* Expandable Details */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-gray-700">
            <div className="mt-6 space-y-6">
              
              {/* Opportunity Cost Breakdown */}
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Opportunity Cost Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Monthly potential savings:</span>
                    <div className="text-emerald-400 font-bold text-lg">
                      ${cost.monthlyPotentialSavings?.toFixed(0) || '0'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Days to deadline:</span>
                    <div className="text-orange-400 font-bold text-lg">
                      {srs.daysToDeadline || 0}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {cost.actionMessage || "Start contributions to capture full benefit"}
                </p>
              </div>
              
              {/* Employment Pass Advantage */}
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-600/30">
                <h4 className="text-sm font-medium text-blue-300 mb-3">Employment Pass Advantage</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Additional SRS room:</span>
                    <div className="text-blue-400 font-bold text-lg">
                      ${advantage.srsLimitAdvantage?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Extra tax savings:</span>
                    <div className="text-emerald-400 font-bold text-lg">
                      ${advantage.additionalTaxSavings?.toFixed(0) || '0'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-300 mt-3">
                  {advantage.vsComparison || "Employment Pass holders have significant tax advantages"}
                </p>
              </div>
              
              {/* Income Management */}
              <div className="bg-gray-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Income Settings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Primary Income (estimated):</span>
                    <span className="text-white">$120,000</span>
                  </div>
                  <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    + Add Additional Income Source
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Update your income in Financial Setup for accurate calculations
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-emerald-700 hover:to-blue-700 transition-colors disabled:opacity-50"
                  onClick={handleSRSAction}
                  disabled={localLoading}
                >
                  {localLoading ? 'Processing...' : `Start $${srs.monthlyTarget?.toFixed(0) || '0'}/month SRS`}
                </button>
                
                <button className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition-colors">
                  View Detailed Tax Strategy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}