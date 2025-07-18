// app/components/PortfolioDashboard.tsx - Add allocation editor integration
'use client';

import { useState, useCallback, useEffect } from 'react';
import NetWorthTracker from './NetWorthTracker';
import FixedPortfolioGrid from './FixedPortfolioGrid';
import PortfolioStatusMetrics from './PortfolioStatusMetrics';
import TaxIntelligenceDisplay from './TaxIntelligenceDisplay';
import InsightsSection from './InsightsSection';
import AllocationTargetEditor from './AllocationTargetEditor';
import { CurrencyToggleSimple } from './CurrencyToggle';
import FinancialSetupButton from './FinancialSetupButton';
import { type CurrencyCode } from '@/app/lib/currency';
import { type Intelligence } from '@/app/lib/types/shared';
import { usePortfolioData } from '@/app/hooks/usePortfolioData';
import { usePortfolioCategoryProcessor } from './PortfolioCategoryProcessor';
import { useActionItemsProcessor } from './ActionItemsProcessor';
import AppleRadialAllocation from './AppleRadialAllocation';
import AllocationChartCard from './AllocationChartCard';

// Live indicator component
const LiveIndicator = () => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    <span className="text-xs text-green-400">Live</span>
  </div>
);

// Default allocation targets
const DEFAULT_TARGETS = {
  core: 25,
  growth: 55,
  hedge: 10,
  liquidity: 10,
  rebalanceThreshold: 5
};

export default function PortfolioDashboard() {
  // UI State
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('SGD');
  const [isAllocationEditorOpen, setIsAllocationEditorOpen] = useState(false);
  const [allocationTargets, setAllocationTargets] = useState(DEFAULT_TARGETS);
  const [showChartView, setShowChartView] = useState(false);

  // Portfolio Data Hook - handles all API integration
  const {
    holdings,
    loading,
    dynamicInsights,
    intelligence,
    taxIntelligence,
    isInsightsLive,
    isIntelligenceLive,
    insightsLoading,
    insightsError,
    fetchHoldings,
    fetchDynamicInsights,
    handleInsightAction
  } = usePortfolioData();

  // Load allocation targets from API
  useEffect(() => {
    const loadAllocationTargets = async () => {
      try {
        const response = await fetch('/api/financial-profile');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.allocationTargets) {
            setAllocationTargets(data.allocationTargets);
          }
        }
      } catch (error) {
        console.error('Failed to load allocation targets:', error);
      }
    };

    loadAllocationTargets();
  }, []);

  // Category Processing - handles portfolio categorization with user targets
  const enhancedCategoryData = usePortfolioCategoryProcessor({
    holdings,
    totalValue: holdings.reduce((sum, h) => sum + h.valueSGD, 0),
    displayCurrency,
    intelligence: intelligence || undefined,
    customTargets: allocationTargets // Pass user targets
  });

  // Action Items Processing - handles recommendation processing
  const { actionItems } = useActionItemsProcessor({
    dynamicInsights,
    intelligence: intelligence || undefined,
    holdings
  });

  // UI Event Handlers
  const handleToggleExpand = useCallback((categoryName: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.clear(); // Only allow one expanded at a time
        newSet.add(categoryName);
      }
      return newSet;
    });
  }, []);

  const handleAllocationTargetsUpdate = (newTargets: typeof allocationTargets) => {
    setAllocationTargets(newTargets);
    // Refresh holdings to update allocation status
    fetchHoldings();
  };

  // Calculate total value in selected display currency
  const totalValue = holdings.reduce((sum, holding) => {
    const currencyValue = displayCurrency === 'SGD' ? holding.valueSGD :
                         displayCurrency === 'USD' ? holding.valueUSD :
                         holding.valueINR;
    return sum + currencyValue;
  }, 0);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading your portfolio...</div>
      </div>
    );
  }

  // Empty State
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Action Bias Portfolio</h1>
          
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">API Connection Issue</h2>
            <p className="text-gray-400 mb-6">Unable to connect to database. Please check your API endpoint or refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Currency Switcher and Intelligence Status */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Action Bias Portfolio</h1>
          
          <div className="flex items-center gap-3">
            <CurrencyToggleSimple 
              displayCurrency={displayCurrency}
              onCurrencyChange={setDisplayCurrency}
            />
            <FinancialSetupButton />
          </div>
        </div>
        
        {/* Portfolio Status Metrics - Extracted Component */}
        <PortfolioStatusMetrics
          totalValue={totalValue}
          displayCurrency={displayCurrency}
          intelligence={intelligence || undefined}
          isLive={isInsightsLive || isIntelligenceLive}
        />

        {/* Net Worth Tracker */}
        <NetWorthTracker />

        {/* Portfolio Allocation with Fixed Portfolio Grid */}
        <div className="mb-6">
          
          
          {/* Portfolio Allocation with Fixed Portfolio Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-200">
              Portfolio Allocation
            </h2>
            <div className="flex items-center gap-3">
              {/* Edit Targets Button */}
              <button
                onClick={() => setIsAllocationEditorOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Edit Targets</span>
                <span className="sm:hidden">Edit</span>
              </button>
              
              {/* Live Indicator */}
              {(isInsightsLive || isIntelligenceLive) && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="hidden sm:inline">Smart Analysis Active</span>
                  <span className="sm:hidden">Live</span>
                </div>
              )}
            </div>
          </div>
          
          {/* ADD APPLE RADIAL ALLOCATION CHART HERE */}
          <AppleRadialAllocation 
            categories={enhancedCategoryData}
            className="mb-6"
          />
          
          <FixedPortfolioGrid
            categories={enhancedCategoryData}
            totalValue={totalValue}
            expandedCards={expandedCards}
            onToggleExpand={handleToggleExpand}
            displayCurrency={displayCurrency}
            onHoldingsUpdate={fetchHoldings}
          />
        </div>

        
        </div>

        {/* AI Insights Section - Extracted Component */}
        <InsightsSection
          actionItems={actionItems}
          isLive={isInsightsLive}
          isLoading={insightsLoading}
          error={insightsError}
          onRefresh={fetchDynamicInsights}
          onAction={handleInsightAction}
        />

        {/* Tax Intelligence Display - Extracted Component */}
        <TaxIntelligenceDisplay
          taxIntelligence={taxIntelligence || undefined}
          isLoading={insightsLoading}
        />

        {/* Allocation Target Editor Modal */}
        <AllocationTargetEditor
          isOpen={isAllocationEditorOpen}
          onClose={() => setIsAllocationEditorOpen(false)}
          currentTargets={allocationTargets}
          onTargetsUpdate={handleAllocationTargetsUpdate}
        />
      </div>
    </div>
  );
}