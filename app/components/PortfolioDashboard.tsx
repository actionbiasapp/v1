// app/components/PortfolioDashboard.tsx - Add allocation editor integration
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import NetWorthTracker from './NetWorthTracker';
import FixedPortfolioGrid from './FixedPortfolioGrid';
import PortfolioStatusMetrics from './PortfolioStatusMetrics';

import { CurrencyToggleSimple } from './CurrencyToggle';
import FinancialSetupButton from './FinancialSetupButton';
import NumberVisibilityToggle from './ui/NumberVisibilityToggle';

import { type CurrencyCode } from '@/app/lib/currency';
import { type Intelligence } from '@/app/lib/types/shared';
import { usePortfolioData } from '@/app/hooks/usePortfolioData';
import { usePortfolioCategoryProcessor } from './PortfolioCategoryProcessor';
import { useActionItemsProcessor } from './ActionItemsProcessor';
import AppleRadialAllocation from './AppleRadialAllocation';
import { calculatePortfolioValue, type ExchangeRates } from '@/app/lib/portfolioCalculations';
import AllocationChartCard from './AllocationChartCard';
import { DEFAULT_ALLOCATION_TARGETS } from '@/app/lib/constants';
import AgentChat from './AgentChat';
import SignalMode from './SignalMode';
import { AgentContext } from '@/app/lib/agent/types';
import { PortfolioSkeleton } from './ui/PortfolioSkeleton';
import ContextualInsights from './ContextualInsights';

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
  const [yearlyDataLoading, setYearlyDataLoading] = useState(true);
  const [monthlySnapshots, setMonthlySnapshots] = useState<any[]>([]); // State for monthly snapshots
  const [monthlyDataLoading, setMonthlyDataLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [usdToSgd, setUsdToSgd] = useState(1.35);
  const [usbMode, setUsbMode] = useState(false);

  // Portfolio Data Hook - handles all API integration
  const {
    holdings,
    loading,
    dynamicInsights,
    intelligence,
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
    setYearlyDataLoading(true);
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
    } finally {
      setYearlyDataLoading(false);
    }
  };

  // Function to load monthly snapshots
  const loadMonthlySnapshots = async () => {
    setMonthlyDataLoading(true);
    try {
      const response = await fetch('/api/monthly-snapshot');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMonthlySnapshots(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load monthly snapshots:', error);
    } finally {
      setMonthlyDataLoading(false);
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
    loadAllocationTargets();
    loadYearlyData();
    loadMonthlySnapshots();
  };

  // Load all data on initial mount
  useEffect(() => {
    loadAllocationTargets();
    loadYearlyData();
    loadMonthlySnapshots();
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
  
  const { totalValue } = calculatePortfolioValue(holdings as any, displayCurrency, exchangeRates);

  // Category Processing - handles portfolio categorization with user targets
  const enhancedCategoryData = usePortfolioCategoryProcessor({
    holdings: holdings as any,
    totalValue: totalValue, // Use the calculated totalValue
    displayCurrency,
    intelligence: intelligence || undefined,
    customTargets: allocationTargets // Pass user targets
  });

  // Action Items Processing - handles recommendation processing
  const { actionItems } = useActionItemsProcessor({
    dynamicInsights,
    intelligence: intelligence || undefined,
    holdings: holdings as any
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
    
    // No need to refresh - the state is already updated
    // The allocation targets are used locally, so no page refresh needed
  };

  // Enhanced portfolio update handler with loading states and scroll management
  const handlePortfolioUpdate = useCallback(async () => {
    // Show loading state
    setToast({ message: 'Updating holdings...', type: 'success' });
    
    try {
      // Add a small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Re-fetch holdings data instead of full page refresh
      await fetchHoldings();
      
      // Show success message
      setToast({ message: 'Holdings updated successfully!', type: 'success' });
      
      // Scroll to top of holdings section to prevent items from disappearing
      const holdingsSection = document.querySelector('.fixed-portfolio-grid');
      if (holdingsSection) {
        holdingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ message: 'Failed to update holdings', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  }, [fetchHoldings]);

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
    return <PortfolioSkeleton />;
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Header Row: Title, Currency Toggle, and Action Buttons */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white tracking-tight">Action Bias</h1>
            
            {/* Right side: Currency Toggle and Action Buttons */}
            <div className="flex items-center gap-2">
              <CurrencyToggleSimple 
                displayCurrency={displayCurrency}
                onCurrencyChange={setDisplayCurrency}
              />
              
              <button
                onClick={() => setUsbMode(!usbMode)}
                className={`bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] ${
                  usbMode ? 'bg-blue-600 text-white' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
                <span className="hidden xs:inline">{usbMode ? 'Signal On' : 'Signal'}</span>
              </button>
              
              <FinancialSetupButton 
                onProfileUpdate={refreshAllData}
                portfolioTotal={totalValue}
                allocationTargets={allocationTargets}
              />
              
              <NumberVisibilityToggle size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-1 sm:pt-1 pt-12">
        {/* Portfolio Status Metrics - Extracted Component */}
        <PortfolioStatusMetrics
          totalValue={totalValue}
          displayCurrency={displayCurrency}
          intelligence={intelligence || undefined}
          exchangeRates={exchangeRates}
          loading={yearlyDataLoading}
          monthlySnapshots={monthlySnapshots}
        />

        {/* Net Worth Tracker */}
        <NetWorthTracker 
          yearlyData={yearlyData} 
          monthlySnapshots={monthlySnapshots}
          portfolioTotal={totalValue}
          displayCurrency={displayCurrency}
          exchangeRates={exchangeRates}
          loading={yearlyDataLoading || monthlyDataLoading}
        />

        {/* Portfolio Allocation with Fixed Portfolio Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200 tracking-tight">
              Holdings
            </h2>
            <button
              onClick={handleRefreshPrices}
              className={`flex items-center gap-2 bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-md ${
                refreshingPrices ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={refreshingPrices}
            >
              {refreshingPrices ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.635 19.364A9 9 0 104.582 9.582" />
                </svg>
              )}
              <span className="hidden sm:inline">{refreshingPrices ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
          
          {toast && (
            <div className={`fixed top-20 left-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg font-medium text-sm ${
              toast.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {toast.message}
            </div>
          )}
          
          <AppleRadialAllocation 
            categories={enhancedCategoryData}
            className="mb-6"
            displayCurrency={displayCurrency}
            exchangeRates={exchangeRates}
          />
          
          <FixedPortfolioGrid
            categories={enhancedCategoryData}
            totalValue={totalValue}
            expandedCards={expandedCards}
            onToggleExpand={handleToggleExpand}
            displayCurrency={displayCurrency}
            onHoldingsUpdate={handlePortfolioUpdate}
          />
          
          {/* Contextual Insights for Portfolio Section */}
          <ContextualInsights
            actionItems={actionItems}
            currentSection="portfolio"
            onAction={handleInsightAction}
          />
        </div>


      </div>
      
      {/* Agent Chat */}
      <AgentChat 
        context={{
          currentHoldings: holdings,
          yearlyData: yearlyData,
          financialProfile: {},
          displayCurrency: displayCurrency
        }}
        onPortfolioUpdate={handlePortfolioUpdate}
        insights={actionItems}
      />

      {/* Signal Mode */}
      <SignalMode
        holdings={holdings as any}
        displayCurrency={displayCurrency}
        exchangeRates={exchangeRates}
        isEnabled={usbMode}
        onToggle={setUsbMode}
        yearlyData={yearlyData}
        allocationTargets={allocationTargets}
      />
    </div>
  );
}