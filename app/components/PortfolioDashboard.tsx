// app/components/PortfolioDashboard.tsx - Add allocation editor integration
'use client';

import { useState, useCallback, useEffect } from 'react';
import NetWorthTracker from './NetWorthTracker';
import FixedPortfolioGrid from './FixedPortfolioGrid';
import PortfolioStatusMetrics from './PortfolioStatusMetrics';
import TaxIntelligenceDisplay from './TaxIntelligenceDisplay';
import InsightsSection from './InsightsSection';
import { CurrencyToggleSimple } from './CurrencyToggle';
import FinancialSetupButton from './FinancialSetupButton';
import { type CurrencyCode } from '@/app/lib/currency';
import { type Intelligence } from '@/app/lib/types/shared';
import { usePortfolioData } from '@/app/hooks/usePortfolioData';
import { usePortfolioCategoryProcessor } from './PortfolioCategoryProcessor';
import { useActionItemsProcessor } from './ActionItemsProcessor';
import AppleRadialAllocation from './AppleRadialAllocation';
import { calculatePortfolioValue, type ExchangeRates } from '@/app/lib/portfolioCalculations';
import AllocationChartCard from './AllocationChartCard';
import { DEFAULT_ALLOCATION_TARGETS } from '@/app/lib/constants';

// Live indicator component
const LiveIndicator = () => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    <span className="text-xs text-green-400">Live</span>
  </div>
);

// Default allocation targets
const DEFAULT_TARGETS = DEFAULT_ALLOCATION_TARGETS;

export default function PortfolioDashboard() {
  // UI State
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('SGD');
  const [allocationTargets, setAllocationTargets] = useState(DEFAULT_TARGETS);
  const [showChartView, setShowChartView] = useState(false);
  const [yearlyData, setYearlyData] = useState<any[]>([]); // State for yearly data
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [usdToSgd, setUsdToSgd] = useState(1.35);

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

  // Function to load yearly data
  const loadYearlyData = async () => {
    try {
      const response = await fetch('/api/yearly-data');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setYearlyData(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load yearly data:', error);
    }
  };

  // Function to load allocation targets
    const loadAllocationTargets = async () => {
      try {
        const response = await fetch('/api/financial-profile');
        if (response.ok) {
          const data = await response.json();
        if (data.success && data.profile) {
          setAllocationTargets({
            core: data.profile.coreTarget || 25,
            growth: data.profile.growthTarget || 55,
            hedge: data.profile.hedgeTarget || 10,
            liquidity: data.profile.liquidityTarget || 10,
            rebalanceThreshold: data.profile.rebalanceThreshold || 5,
          });
          }
        }
      } catch (error) {
        console.error('Failed to load allocation targets:', error);
      }
    };

  // Centralized refresh function
  const refreshAllData = () => {
    fetchHoldings();
    fetchDynamicInsights();
    loadAllocationTargets();
    loadYearlyData();
  };

  // Load all data on initial mount
  useEffect(() => {
    fetchHoldings();
    loadAllocationTargets();
    loadYearlyData();
  }, []);

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch('/api/exchange-rates');
        if (res.ok) {
          const data = await res.json();
          if (data.rates && data.rates.USD_TO_SGD) setUsdToSgd(Number(data.rates.USD_TO_SGD));
        }
      } catch {}
    }
    fetchRate();
  }, []);

  // Calculate total value using centralized calculation
  const exchangeRates: ExchangeRates | null = usdToSgd ? {
    SGD_TO_USD: 1 / usdToSgd,
    SGD_TO_INR: 63.0, // Approximate rate
    USD_TO_SGD: usdToSgd,
    USD_TO_INR: usdToSgd * 63.0,
    INR_TO_SGD: 1 / 63.0,
    INR_TO_USD: 1 / (usdToSgd * 63.0)
  } : null;
  
  const { totalValue } = calculatePortfolioValue(holdings, displayCurrency, exchangeRates);

  // Category Processing - handles portfolio categorization with user targets
  const enhancedCategoryData = usePortfolioCategoryProcessor({
    holdings,
    totalValue: totalValue, // Use the calculated totalValue
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

  const handleAllocationTargetsUpdate = async (newTargets: typeof allocationTargets) => {
    setAllocationTargets(newTargets);
    
    // NEW: Save to database via financial-profile API
    try {
      await fetch('/api/financial-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocationTargets: newTargets })
      });
      console.log('✅ Allocation targets saved to database');
    } catch (error) {
      console.error('❌ Failed to save allocation targets:', error);
    }
    
    fetchHoldings(); // Refresh to use new targets
  };

  // Refresh Prices Handler
  const handleRefreshPrices = async () => {
    setRefreshingPrices(true);
    setToast(null);
    try {
      const response = await fetch('/api/prices/update');
      const data = await response.json();
      if (data.success) {
        setToast({ message: `Prices updated: ${data.summary.updated} updated, ${data.summary.failed} failed.`, type: 'success' });
        refreshAllData();
      } else {
        setToast({ message: `Error: ${data.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error while updating prices.', type: 'error' });
    } finally {
      setRefreshingPrices(false);
    }
  };

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
            <p className="text-gray-400 mb-6">Unable to connect to database. Holdings count: {holdings?.length || 'undefined'}. Please check your API endpoint or refresh the page.</p>
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
            <FinancialSetupButton 
              onProfileUpdate={refreshAllData}
              portfolioTotal={totalValue}
              allocationTargets={allocationTargets}
            />
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
        <NetWorthTracker yearlyData={yearlyData} portfolioTotal={totalValue} />

        {/* Portfolio Allocation with Fixed Portfolio Grid */}
        <div className="mb-6">
          
          
          {/* Portfolio Allocation with Fixed Portfolio Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-200">
              Holdings
            </h2>
              <button
              onClick={handleRefreshPrices}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${refreshingPrices ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              disabled={refreshingPrices}
            >
              {refreshingPrices ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.635 19.364A9 9 0 104.582 9.582" /></svg>
              )}
              <span>{refreshingPrices ? 'Updating...' : 'Refresh Prices'}</span>
            </button>
          </div>
          {toast && (
            <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{toast.message}</div>
          )}
          
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
      </div>
    </div>
  );
}