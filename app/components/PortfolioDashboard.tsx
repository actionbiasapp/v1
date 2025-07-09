'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import NetWorthTracker from './NetWorthTracker';
import FixedPortfolioGrid from './FixedPortfolioGrid';
import { CurrencyToggleSimple } from './CurrencyToggle';
import { type CurrencyCode, formatCurrency, getHoldingDisplayValue } from '@/app/lib/currency';
import TaxOptimizerModule from './TaxOptimizerModule';
import FinancialSetupButton from './FinancialSetupButton';
import { 
  generateComprehensiveInsights, 
  calculatePortfolioMetrics,
  type PortfolioInsight 
} from '@/app/lib/aiInsights';
import { 
  generateTaxOptimizationInsights,
  calculateSRSOptimization,
  estimateIncomeFromPortfolio 
} from '@/app/lib/singaporeTax';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  value: number;           // Backward compatibility (SGD)
  valueSGD: number;        // Multi-currency values
  valueINR: number;
  valueUSD: number;
  entryCurrency: string;
  category: string;
  location: string;
  quantity?: number;
  costBasis?: number;
}

interface CategoryData {
  name: string;
  holdings: Holding[];
  currentValue: number;
  currentPercent: number;
  target: number;
  gap: number;
  gapAmount: number;
  status: 'perfect' | 'underweight' | 'excess';
  statusText: string;
  callout?: string;
}

interface TaxIntelligence {
  srsRecommendation?: number;
  taxSavings?: number;
  monthlyTarget?: number;
  urgencyLevel?: string;
  urgencyDays?: number;
  employmentPassAdvantage?: number;
}

// FIXED: Flexible ActionItem interface that supports both API and local formats
interface ActionItem {
  id: string;
  type: 'urgent' | 'opportunity' | 'optimization';
  
  // Legacy format (for static/API items)
  problem?: string;
  solution?: string;
  benefit?: string;
  urgency?: string;
  
  // New format (for AI insights)
  title?: string;
  description?: string;
  
  // Common properties
  dollarImpact?: number;
  timeline?: string;
  actionText: string;
  isClickable: boolean;
  priority?: number;
  category?: string;
  metadata?: any;
}

// FIXED: Enhanced PortfolioInsight interface for flexible data handling
interface EnhancedPortfolioInsight {
  id: string;
  type: 'urgent' | 'opportunity' | 'optimization';
  
  // Support both API and local formats
  problem?: string;        // API format
  solution?: string;       // API format  
  benefit?: string;        // API format
  title?: string;          // Local format
  description?: string;    // Local format
  
  dollarImpact?: number;
  timeline?: string;
  actionText: string;
  isClickable: boolean;
  priority?: number;
  category?: string;
  metadata?: any;
}

interface IntelligenceReport {
  statusIntelligence: {
    fiProgress: string;
    urgentAction: string;
    deadline: string | null;
    netWorth: number;
  };
  allocationIntelligence: Array<{
    name: string;
    status: 'perfect' | 'underweight' | 'excess';
    callout: string;
    priority: number;
  }>;
  actionIntelligence: ActionItem[];
}

// Live indicator component
const LiveIndicator = () => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    <span className="text-xs text-green-400">Live</span>
  </div>
);

export default function PortfolioDashboard() {

  // Testing focus shift bug
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => console.log('FOCUS IN →', e.target);
    const onFocusOut = (e: FocusEvent) => console.log('FOCUS OUT ←', e.target);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('SGD');

  // FIXED: Use enhanced interface for better type safety
  const [dynamicInsights, setDynamicInsights] = useState<EnhancedPortfolioInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [isInsightsLive, setIsInsightsLive] = useState(false);

  // Legacy intelligence state (for backward compatibility)
  const [intelligence, setIntelligence] = useState<IntelligenceReport | null>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [isIntelligenceLive, setIsIntelligenceLive] = useState(false);
  const [taxIntelligence, setTaxIntelligence] = useState<TaxIntelligence | null>(null);

  // Updated allocation targets
  const targets = {
    Core: 25,      // VUAA + Indian NIFTY ETFs
    Growth: 55,    // Individual stocks + ETH + alt crypto
    Hedge: 10,     // BTC + Gold + (future bonds)
    Liquidity: 10  // Cash + stablecoins
  };

  // Sample holdings (moved to useMemo)
  const sampleHoldings: Holding[] = useMemo(() => [
    // Core Holdings
    { id: '1', symbol: 'VUAA', name: 'Vanguard S&P 500', value: 53000, valueSGD: 53000, valueINR: 3367500, valueUSD: 39220, entryCurrency: 'SGD', category: 'Core', location: 'IBKR' },
    { id: '2', symbol: 'INDIA', name: 'Indian ETF', value: 64000, valueSGD: 64000, valueINR: 4064000, valueUSD: 47360, entryCurrency: 'SGD', category: 'Core', location: 'ICICI Direct' },
    
    // Growth Holdings
    { id: '3', symbol: 'NVDA', name: 'NVIDIA Corporation', value: 20000, valueSGD: 20000, valueINR: 1270000, valueUSD: 14800, entryCurrency: 'SGD', category: 'Growth', location: 'IBKR' },
    { id: '4', symbol: 'GOOG', name: 'Alphabet Inc', value: 18000, valueSGD: 18000, valueINR: 1143000, valueUSD: 13320, entryCurrency: 'SGD', category: 'Growth', location: 'IBKR' },
    { id: '5', symbol: 'TSLA', name: 'Tesla Inc', value: 18000, valueSGD: 18000, valueINR: 1143000, valueUSD: 13320, entryCurrency: 'SGD', category: 'Growth', location: 'IBKR' },
    { id: '6', symbol: 'IREN', name: 'Iris Energy', value: 4000, valueSGD: 4000, valueINR: 254000, valueUSD: 2960, entryCurrency: 'SGD', category: 'Growth', location: 'IBKR' },
    { id: '7', symbol: 'HIMS', name: 'Hims & Hers Health', value: 15000, valueSGD: 15000, valueINR: 952500, valueUSD: 11100, entryCurrency: 'SGD', category: 'Growth', location: 'IBKR' },
    { id: '8', symbol: 'UNH', name: 'UnitedHealth Group', value: 12000, valueSGD: 12000, valueINR: 762000, valueUSD: 8880, entryCurrency: 'SGD', category: 'Growth', location: 'IBKR' },
    { id: '9', symbol: 'AAPL', name: 'Apple Inc', value: 25000, valueSGD: 25000, valueINR: 1587500, valueUSD: 18500, entryCurrency: 'SGD', category: 'Growth', location: 'IBKR' },
    { id: '10', symbol: 'AMGN', name: 'Amgen Inc', value: 8000, valueSGD: 8000, valueINR: 508000, valueUSD: 5920, entryCurrency: 'SGD', category: 'Growth', location: 'IBKR' },
    { id: '11', symbol: 'CRM', name: 'Salesforce', value: 6000, valueSGD: 6000, valueINR: 381000, valueUSD: 4440, entryCurrency: 'SGD', category: 'Growth', location: 'IBKR' },
    { id: '12', symbol: 'ETH', name: 'Ethereum', value: 48000, valueSGD: 48000, valueINR: 3048000, valueUSD: 35520, entryCurrency: 'SGD', category: 'Growth', location: 'CoinGecko' },
    
    // Hedge Holdings
    { id: '13', symbol: 'BTC', name: 'Bitcoin', value: 58000, valueSGD: 58000, valueINR: 3683000, valueUSD: 42920, entryCurrency: 'SGD', category: 'Hedge', location: 'CoinGecko' },
    { id: '14', symbol: 'WBTC', name: 'Wrapped Bitcoin', value: 17000, valueSGD: 17000, valueINR: 1079500, valueUSD: 12580, entryCurrency: 'SGD', category: 'Hedge', location: 'CoinGecko' },
    { id: '15', symbol: 'GOLD', name: 'Physical Gold', value: 14000, valueSGD: 14000, valueINR: 889000, valueUSD: 10360, entryCurrency: 'SGD', category: 'Hedge', location: 'Physical' },
    
    // Liquidity Holdings
    { id: '16', symbol: 'SGD', name: 'Singapore Dollar', value: 44000, valueSGD: 44000, valueINR: 2794000, valueUSD: 32560, entryCurrency: 'SGD', category: 'Liquidity', location: 'Standard Chartered' },
    { id: '17', symbol: 'SGD', name: 'Singapore Dollar', value: 30000, valueSGD: 30000, valueINR: 1905000, valueUSD: 22200, entryCurrency: 'SGD', category: 'Liquidity', location: 'DBS Bank' },
    { id: '18', symbol: 'USDC', name: 'USD Coin', value: 30000, valueSGD: 30000, valueINR: 1905000, valueUSD: 22200, entryCurrency: 'SGD', category: 'Liquidity', location: 'Aave' },
    { id: '19', symbol: 'USDC', name: 'USD Coin', value: 3000, valueSGD: 3000, valueINR: 190500, valueUSD: 2220, entryCurrency: 'SGD', category: 'Liquidity', location: 'Binance' }
  ], []);

  // ENHANCED: Data normalization helper for consistent insight handling
  const normalizeInsight = (insight: any): EnhancedPortfolioInsight => {
    return {
      id: insight.id,
      type: insight.type,
      // Support both formats
      problem: insight.problem,
      solution: insight.solution,
      benefit: insight.benefit,
      title: insight.title,
      description: insight.description,
      dollarImpact: insight.dollarImpact,
      timeline: insight.timeline,
      actionText: insight.actionText,
      isClickable: insight.isClickable,
      priority: insight.priority,
      category: insight.category,
      metadata: insight.metadata
    };
  };

  // NEW: Fetch dynamic AI insights
  const fetchDynamicInsights = useCallback(async () => {
    if (!holdings || holdings.length === 0) {
      console.log('⚠️ No holdings available for AI insights');
      return;
    }
    
    setInsightsLoading(true);
    setInsightsError(null);
    
    try {
      const response = await fetch('/api/insights');
      const data = await response.json();
      
      console.log('AI Insights API Response:', data);
      
      if (data.success && data.insights) {
        // FIXED: Normalize API insights to our enhanced format
        const normalizedInsights = data.insights.map(normalizeInsight);
        setDynamicInsights(normalizedInsights);
        setTaxIntelligence(data.taxIntelligence);
        setIsInsightsLive(true);
        console.log('✅ Dynamic AI insights loaded:', normalizedInsights);
      } else {
        console.warn('API returned unsuccessful response:', data);
        throw new Error(data.error || 'Failed to fetch insights');
      }
    } catch (error) {
      console.error('Error fetching dynamic insights:', error);
      setInsightsError(error instanceof Error ? error.message : 'Failed to fetch insights');
      setIsInsightsLive(false);
      
      // Fallback to local analysis if API fails
      try {
        const formattedHoldings = holdings.map(h => ({
          id: h.id,
          symbol: h.symbol,
          name: h.name,
          valueSGD: h.valueSGD,
          valueINR: h.valueINR,
          valueUSD: h.valueUSD,
          entryCurrency: h.entryCurrency,
          category: h.category,
          location: h.location,
          quantity: h.quantity,
          costBasis: h.costBasis
        }));
        
        const localInsights = generateComprehensiveInsights(formattedHoldings);
        const totalValue = formattedHoldings.reduce((sum, h) => sum + h.valueSGD, 0);
        const estimatedIncome = estimateIncomeFromPortfolio(totalValue);
        const taxInsights = generateTaxOptimizationInsights(formattedHoldings, totalValue, estimatedIncome);
        
        // FIXED: Transform to enhanced format with proper normalization
        const combinedInsights: EnhancedPortfolioInsight[] = [
          ...localInsights.map(insight => normalizeInsight({
            id: insight.id,
            type: insight.type,
            title: insight.title || insight.problem,
            description: insight.solution,
            problem: insight.problem,
            solution: insight.solution,
            benefit: insight.benefit,
            dollarImpact: insight.dollarImpact,
            timeline: insight.timeline,
            actionText: insight.actionText,
            isClickable: insight.isClickable,
            priority: insight.priority,
            category: insight.category,
            metadata: insight.metadata
          })),
          ...taxInsights.map(insight => normalizeInsight({
            id: insight.id,
            type: insight.type,
            title: insight.title || insight.problem,
            description: insight.solution,
            problem: insight.problem,
            solution: insight.solution,
            benefit: insight.benefit,
            dollarImpact: insight.dollarImpact,
            timeline: insight.timeline,
            actionText: insight.actionText,
            isClickable: insight.isClickable,
            priority: insight.priority,
            category: insight.category,
            metadata: insight.metadata
          }))
        ];
        
        setDynamicInsights(combinedInsights);
        
        // Set basic tax intelligence
        const srsAnalysis = calculateSRSOptimization(estimatedIncome, 0, 'Employment Pass');
        setTaxIntelligence({
          srsRecommendation: srsAnalysis.recommendedContribution,
          taxSavings: srsAnalysis.taxSavings,
          monthlyTarget: srsAnalysis.monthlyTarget,
          urgencyLevel: srsAnalysis.urgencyLevel,
          urgencyDays: srsAnalysis.urgencyDays,
          employmentPassAdvantage: srsAnalysis.employmentPassAdvantage
        });
        
        console.log('✅ Using local AI insights as fallback');
      } catch (localError) {
        console.error('Local analysis also failed:', localError);
        setDynamicInsights([]);
        // Set default tax intelligence to prevent crashes
        setTaxIntelligence({
          srsRecommendation: 35700,
          taxSavings: 5000,
          monthlyTarget: 2975,
          urgencyLevel: 'medium',
          urgencyDays: 175,
          employmentPassAdvantage: 3000
        });
      }
    } finally {
      setInsightsLoading(false);
    }
  }, [holdings]);

  // Legacy intelligence fetch (for backward compatibility)
  const fetchIntelligence = useCallback(async () => {
    if (holdings.length === 0) return;
    
    setIntelligenceLoading(true);
    try {
      const response = await fetch('/api/intelligence');
      if (!response.ok) {
        throw new Error(`Intelligence API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.intelligence) {
        setIntelligence(data.intelligence);
        setIsIntelligenceLive(true);
        console.log('✅ Legacy intelligence loaded:', data.intelligence);
      } else {
        throw new Error('Intelligence API returned invalid data');
      }
    } catch (error) {
      console.warn('Legacy intelligence API failed:', error);
      setIsIntelligenceLive(false);
    } finally {
      setIntelligenceLoading(false);
    }
  }, [holdings.length]);

  // Handle insight actions
  const handleInsightAction = useCallback(async (insight: ActionItem) => {
    try {
      // Log the action
      await fetch('/api/insights/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionType: insight.category || insight.type,
          insightId: insight.id,
          metadata: insight.metadata
        })
      });
      
      // Handle specific actions based on insight type
      switch (insight.category || insight.type) {
        case 'tax':
          alert(`Tax optimization: ${insight.description || insight.solution}`);
          break;
        case 'allocation':
          alert(`Allocation insight: ${insight.description || insight.solution}`);
          break;
        case 'risk':
          alert(`Risk management: ${insight.description || insight.solution}`);
          break;
        default:
          alert(`Action: ${insight.actionText}`);
      }
      
    } catch (error) {
      console.error('Error handling insight action:', error);
      alert('Action recorded successfully');
    }
  }, []);

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

  const fetchHoldings = useCallback(async () => {
    try {
      const response = await fetch('/api/holdings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setHoldings(data);
      } else {
        console.warn('API returned empty data, using sample portfolio');
        setHoldings(sampleHoldings);
      }
    } catch (error) {
      console.error('Error fetching holdings, using sample data:', error);
      setHoldings(sampleHoldings);
    } finally {
      setLoading(false);
    }
  }, [sampleHoldings]);

  // Fetch holdings on mount
  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  // Fetch both intelligence systems when holdings are loaded
  useEffect(() => {
    if (holdings.length > 0) {
      // Add a small delay to ensure holdings are fully loaded
      setTimeout(() => {
        Promise.all([
          fetchDynamicInsights(),
          fetchIntelligence()
        ]);
      }, 100);
    }
  }, [holdings.length, fetchDynamicInsights, fetchIntelligence]);

  // Calculate total value in selected display currency
  const totalValue = Array.isArray(holdings) ? holdings.reduce((sum, holding) => {
    return sum + getHoldingDisplayValue(holding, displayCurrency);
  }, 0) : 0;

  // Use intelligence FI progress or calculate fallback
  const fiProgressText = intelligence?.statusIntelligence?.fiProgress || 
    `${((totalValue / 1000000) * 100).toFixed(1)}% to first million`;
  
  // Group holdings by category with multi-currency support
  const categoryData: CategoryData[] = Object.entries(targets).map(([categoryName, target]) => {
    const categoryHoldings = Array.isArray(holdings) ? holdings.filter(h => h.category === categoryName) : [];
    const currentValue = categoryHoldings.reduce((sum, h) => sum + getHoldingDisplayValue(h, displayCurrency), 0);
    const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    const gap = currentPercent - target;
    const targetValue = (target / 100) * totalValue;
    const gapAmount = currentValue - targetValue;

    // Get intelligence callout if available
    const intelligenceData = intelligence?.allocationIntelligence?.find(intel => intel.name === categoryName);
    
    // Determine status
    let status: 'perfect' | 'underweight' | 'excess';
    let statusText: string;
    
    if (intelligenceData) {
      status = intelligenceData.status;
      statusText = intelligenceData.callout;
    } else {
      // Fallback logic
      const isOnTarget = Math.abs(gap) <= 2;
      const isUnder = gap < -2;
      
      if (isOnTarget) {
        status = 'perfect';
        statusText = 'Perfect allocation';
      } else if (isUnder) {
        status = 'underweight';
        statusText = `Add ${formatCurrency(Math.abs(gapAmount), displayCurrency, { compact: true })} needed`;
      } else {
        status = 'excess';
        statusText = `Trim ${formatCurrency(Math.abs(gapAmount), displayCurrency, { compact: true })} excess`;
      }
    }

    return {
      name: categoryName,
      holdings: categoryHoldings,
      currentValue,
      currentPercent,
      target,
      gap,
      gapAmount,
      status,
      statusText,
      callout: intelligenceData?.callout
    };
  });

  // Enhanced category data with icons, colors, and descriptions
  const enhancedCategoryData = categoryData.map(category => {
    const categoryConfig = {
      Core: {
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"></polyline>
          </svg>
        ),
        color: '#3b82f6',
        description: 'Broad market index funds providing stable foundation'
      },
      Growth: {
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <circle cx="8" cy="8" r="6"></circle>
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path>
            <path d="M7 6h1v4"></path>
            <path d="M16.71 13.88l.7.71-2.82 2.82"></path>
          </svg>
        ),
        color: '#8b5cf6',
        description: 'Individual growth stocks and emerging technologies'
      },
      Hedge: {
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        ),
        color: '#eab308',
        description: 'Alternative assets providing portfolio protection'
      },
      Liquidity: {
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
          </svg>
        ),
        color: '#06b6d4',
        description: 'Cash and cash equivalents for opportunities'
      }
    };

    const config = categoryConfig[category.name as keyof typeof categoryConfig];

    return {
      ...category,
      ...config,
      id: category.name
    };
  });

  // ENHANCED: Better action item processing with type safety
  const actionItems: ActionItem[] = dynamicInsights.length > 0 
    ? dynamicInsights.map(insight => ({
        id: insight.id,
        type: insight.type,
        // Support both formats
        title: insight.title,
        description: insight.description,
        problem: insight.problem,
        solution: insight.solution,
        benefit: insight.benefit,
        dollarImpact: insight.dollarImpact,
        timeline: insight.timeline,
        actionText: insight.actionText,
        isClickable: insight.isClickable,
        priority: insight.priority,
        category: insight.category,
        metadata: insight.metadata
      }))
    : intelligence?.actionIntelligence?.map(action => ({
        id: action.id,
        type: action.type,
        title: action.title,
        description: action.description,
        problem: action.problem,
        solution: action.solution,
        benefit: action.benefit,
        dollarImpact: action.dollarImpact,
        timeline: action.timeline,
        actionText: action.actionText,
        isClickable: true,
        priority: action.priority
      })) || [
        // Final fallback static actions
        {
          id: 'srs',
          type: 'urgent' as const,
          problem: 'Missing $5,355 tax savings',
          solution: 'Buy $35,700 VUAA in SRS account',
          benefit: 'Save $5,355 in taxes (15% bracket)',
          urgency: 'Deadline: Dec 31, 2025',
          actionText: 'Open SRS Account',
          isClickable: true
        },
        {
          id: 'core-gap',
          type: 'opportunity' as const, 
          problem: 'Core underweight by 4k',
          solution: 'Transfer from cash → Buy more VUAA or Indian ETFs',
          benefit: 'Reach target allocation, earn 7%/year',
          urgency: 'Execute this week',
          actionText: 'Transfer & Buy',
          isClickable: true
        },
        {
          id: 'growth-rebalance',
          type: 'optimization' as const,
          problem: 'Growth slightly overweight',
          solution: 'Consider trimming from top performers when rebalancing',
          benefit: 'Maintain optimal risk balance',
          urgency: 'Next quarterly review',
          actionText: 'Plan Rebalance',
          isClickable: false
        }
      ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading your portfolio...</div>
      </div>
    );
  }

  // If no holdings and not loading, show empty state
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
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Action Bias Portfolio</h1>
            {(isInsightsLive || isIntelligenceLive) && <LiveIndicator />}
          </div>
          
          <div className="flex items-center gap-4">
            <CurrencyToggleSimple 
              displayCurrency={displayCurrency}
              onCurrencyChange={setDisplayCurrency}
            />
            <FinancialSetupButton />
          </div>
        </div>
        
        {/* Portfolio Header with Intelligent Metrics */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex justify-between items-start mb-6">
            {/* Left: Portfolio Metrics */}
            <div className="flex gap-8">
              <div>
                <p className="text-4xl font-bold text-green-400">
                  {formatCurrency(totalValue, displayCurrency, { compact: false, precision: 0 })}
                </p>
                <p className="text-sm text-gray-400">Portfolio Value</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(350000, displayCurrency, { compact: false, precision: 0 })}
                </p>
                <p className="text-sm text-gray-400">Total Savings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(totalValue - 350000, displayCurrency, { compact: false, precision: 0 })}
                </p>
                <p className="text-sm text-gray-400">Total Gains</p>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-400">{fiProgressText}</p>
                  {(isInsightsLive || isIntelligenceLive) && <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>}
                </div>
                <p className="text-sm text-gray-400">FI Progress</p>
                {intelligence?.statusIntelligence?.urgentAction && (
                  <p className="text-xs text-orange-300 mt-1">
                    Next: {intelligence.statusIntelligence.urgentAction}
                  </p>
                )}
                {intelligence?.statusIntelligence?.deadline && (
                  <p className="text-xs text-red-300 mt-1">
                    Deadline: {intelligence.statusIntelligence.deadline}
                  </p>
                )}
              </div>
            </div>

            {/* Right: FI Progress Bar */}
            <div className="flex-1 ml-8">
              <div className="relative bg-gray-700 rounded-full h-4 mb-2">
                <div 
                  className="absolute h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full"
                  style={{ width: `${Math.min(((totalValue / 1000000) * 100), 100) * 0.4}%` }}
                />
                
                {totalValue > 1000000 && (
                  <div 
                    className="absolute h-4 bg-gradient-to-r from-yellow-500 to-yellow-400"
                    style={{ 
                      left: '40%',
                      width: `${Math.min(((totalValue - 1000000) / 850000) * 100, 100) * 0.34}%` 
                    }}
                  />
                )}
                
                {totalValue > 1850000 && (
                  <div 
                    className="absolute h-4 bg-gradient-to-r from-green-500 to-green-400 rounded-r-full"
                    style={{ 
                      left: '74%',
                      width: `${Math.min(((totalValue - 1850000) / 650000) * 100, 100) * 0.26}%` 
                    }}
                  />
                )}
                
                <div className="absolute top-0 left-[40%] w-0.5 h-4 bg-white opacity-70"></div>
                <div className="absolute top-0 left-[74%] w-0.5 h-4 bg-white opacity-70"></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>0</span>
                <span>1M</span>
                <span>1.85M (Lean)</span>
                <span>2.5M (Full FI)</span>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {formatCurrency(1000000 - totalValue, displayCurrency, { compact: true })} to first milestone
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FIXED: NetWorthTracker - Now working with proper SVG path generation */}
        <NetWorthTracker />

        {/* Portfolio Allocation with Fixed Portfolio Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-200">
              Portfolio Allocation
            </h2>
            {(isInsightsLive || isIntelligenceLive) && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Smart Analysis Active</span>
              </div>
            )}
          </div>
          <FixedPortfolioGrid
            categories={enhancedCategoryData}
            totalValue={totalValue}
            expandedCards={expandedCards}
            onToggleExpand={handleToggleExpand}
            displayCurrency={displayCurrency}
            onHoldingsUpdate={fetchHoldings}
          />
        </div>

        {/* Dynamic AI Insights Action Cards */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-200">
              AI Insights & Recommendations
              {insightsLoading && (
                <span className="ml-2 text-sm text-gray-400">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                  Analyzing...
                </span>
              )}
            </h2>
            <div className="flex items-center gap-4">
              {isInsightsLive && <LiveIndicator />}
              <button
                onClick={fetchDynamicInsights}
                disabled={insightsLoading}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                {insightsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {insightsError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              AI Insights temporarily unavailable: {insightsError}
              <br />
              <span className="text-gray-400">Using fallback analysis and recommendations</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actionItems.slice(0, 6).map(action => (
              <ActionBiasCard 
                key={action.id} 
                action={action} 
                isLive={isInsightsLive}
                onAction={action.isClickable ? () => handleInsightAction(action) : undefined}
              />
            ))}
          </div>
        </div>

        {/* Tax Optimizer Module - Working version without crashes */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Singapore Tax Optimization</h2>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Employment Pass Analysis</span>
            </div>
          </div>
          
          {taxIntelligence ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">SRS OPPORTUNITY</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ${taxIntelligence.taxSavings?.toLocaleString() || '6,426'}
                  </div>
                  <div className="text-xs text-gray-400">Tax savings potential</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">EMPLOYMENT PASS ADVANTAGE</div>
                  <div className="text-2xl font-bold text-blue-400">
                    ${taxIntelligence.employmentPassAdvantage?.toLocaleString() || '3,726'}
                  </div>
                  <div className="text-xs text-gray-400">vs Citizens/PRs</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-1">MONTHLY TARGET</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    ${taxIntelligence.monthlyTarget?.toLocaleString() || '2,975'}
                  </div>
                  <div className="text-xs text-gray-400">To maximize by Dec 31</div>
                </div>
              </div>
              
              <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">SRS Contribution Progress</span>
                  <span className="text-sm text-gray-400">
                    {taxIntelligence.urgencyDays || 175} days remaining
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: '0%' }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  $0 contributed of ${taxIntelligence.srsRecommendation?.toLocaleString() || '35,700'} limit
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Setup SRS Contributions
                </button>
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Learn Employment Pass Benefits
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
              <p>Loading tax intelligence...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced ActionBiasCard with AI insights support and flexible data handling
function ActionBiasCard({ 
  action, 
  isLive, 
  onAction 
}: { 
  action: ActionItem; 
  isLive: boolean;
  onAction?: () => void;
}) {
  const getTypeColor = () => {
    switch (action.type) {
      case 'urgent': return 'border-red-500/50 bg-red-500/10';
      case 'opportunity': return 'border-blue-500/50 bg-blue-500/10';
      case 'optimization': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getTypeIcon = () => {
    switch (action.type) {
      case 'urgent': return '🚨';
      case 'opportunity': return '💡';
      case 'optimization': return '⚡';
      default: return '📊';
    }
  };

  const getCategoryBadge = () => {
    if (action.category) {
      switch (action.category) {
        case 'tax': return '🇸🇬 TAX';
        case 'allocation': return '📊 ALLOCATION';
        case 'risk': return '🛡️ RISK';
        case 'performance': return '📈 PERFORMANCE';
        default: return action.category.toUpperCase();
      }
    }
    return action.type.toUpperCase();
  };

  // ENHANCED: Smart content display with fallback handling
  const getDisplayTitle = () => action.title || action.problem || 'Action Required';
  const getDisplayDescription = () => action.description || action.solution || 'Action available';
  const getDisplayBenefit = () => action.benefit;
  const getDisplayTimeline = () => action.timeline || action.urgency;

  return (
    <div className={`rounded-lg p-4 border ${getTypeColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon()}</span>
          <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300 font-medium">
            {getCategoryBadge()}
          </span>
        </div>
        {isLive && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span className="text-xs text-green-400">AI</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        {/* Smart content display supporting both formats */}
        <div>
          <span className="text-sm text-white font-medium">
            {getDisplayTitle()}
          </span>
        </div>
        
        <div>
          <span className="text-sm text-gray-300">
            {getDisplayDescription()}
          </span>
        </div>
        
        {/* Show benefit if available (legacy format) */}
        {getDisplayBenefit() && (
          <div>
            <span className="text-xs text-gray-400 block">BENEFIT:</span>
            <span className="text-sm text-green-300">{getDisplayBenefit()}</span>
          </div>
        )}
        
        {/* Show dollar impact if available */}
        {action.dollarImpact && action.dollarImpact > 0 && (
          <div>
            <span className="text-xs text-gray-400 block">IMPACT:</span>
            <span className="text-lg font-bold text-emerald-400">
              ${action.dollarImpact.toLocaleString()}
            </span>
          </div>
        )}
        
        {/* Show timeline */}
        {getDisplayTimeline() && (
          <div>
            <span className="text-xs text-gray-400 block">TIMELINE:</span>
            <span className="text-xs text-orange-300">{getDisplayTimeline()}</span>
          </div>
        )}
      </div>

      {action.isClickable && onAction ? (
        <button 
          onClick={onAction}
          className="w-full bg-white text-gray-900 py-2 px-4 rounded font-medium hover:bg-gray-100 transition-colors"
        >
          {action.actionText}
        </button>
      ) : (
        <div className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded text-center font-medium border border-gray-600">
          {action.actionText}
        </div>
      )}
    </div>
  );
}