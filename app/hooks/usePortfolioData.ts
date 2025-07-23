// app/hooks/usePortfolioData.ts - Extracted API Integration Hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type CurrencyCode, getHoldingDisplayValue } from '@/app/lib/currency';
import { API_ENDPOINTS, FINANCIAL_CONSTANTS } from '@/app/lib/constants';
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
import { 
  UnifiedActionItem as ActionItem,
  TaxIntelligence,
  IntelligenceReport,
  normalizeActionItem
} from '@/app/lib/types/shared';

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

interface UsePortfolioDataReturn {
  // Holdings data
  holdings: Holding[];
  loading: boolean;
  fetchHoldings: () => Promise<void>;
  
  // Insights data
  dynamicInsights: ActionItem[];
  insightsLoading: boolean;
  insightsError: string | null;
  isInsightsLive: boolean;
  fetchDynamicInsights: () => Promise<void>;
  
  // Intelligence data
  intelligence: IntelligenceReport | null;
  intelligenceLoading: boolean;
  isIntelligenceLive: boolean;
  fetchIntelligence: () => Promise<void>;
  
  // Tax intelligence
  taxIntelligence: TaxIntelligence | null;
  
  // Action handler
  handleInsightAction: (insight: ActionItem) => Promise<void>;
}

export function usePortfolioData(): UsePortfolioDataReturn {
  // Holdings state
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  // Insights state
  const [dynamicInsights, setDynamicInsights] = useState<ActionItem[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [isInsightsLive, setIsInsightsLive] = useState(false);

  // Intelligence state
  const [intelligence, setIntelligence] = useState<IntelligenceReport | null>(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [isIntelligenceLive, setIsIntelligenceLive] = useState(false);
  const [taxIntelligence, setTaxIntelligence] = useState<TaxIntelligence | null>(null);

  // Sample holdings data
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

  // Fetch holdings from API
  const fetchHoldings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.HOLDINGS);
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
  };

  // Fetch dynamic insights from API
  const fetchDynamicInsights = useCallback(async () => {
    if (!holdings || holdings.length === 0) {
      console.log('⚠️ No holdings available for AI insights');
      return;
    }
    
    setInsightsLoading(true);
    setInsightsError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.INSIGHTS);
      const data = await response.json();
      
      console.log('AI Insights API Response:', data);
      
      if (data.success && data.insights) {
        // Use shared normalization function
        const normalizedInsights = data.insights.map(normalizeActionItem);
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
      
      // Fallback to local analysis using shared types
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
        
        // Normalize all insights using shared function
        const combinedInsights: ActionItem[] = [
          ...localInsights.map(normalizeActionItem),
          ...taxInsights.map(normalizeActionItem)
        ];
        
        setDynamicInsights(combinedInsights);
        
        // Set basic tax intelligence
        const srsAnalysis = calculateSRSOptimization(estimatedIncome, 0, 'Employment Pass');
        setTaxIntelligence({
          srsOptimization: {
            remainingRoom: srsAnalysis.recommendedContribution,
            taxSavings: srsAnalysis.taxSavings,
            daysToDeadline: srsAnalysis.urgencyDays,
            monthlyTarget: srsAnalysis.monthlyTarget || 0,
            urgencyLevel: srsAnalysis.urgencyLevel,
            maxContribution: FINANCIAL_CONSTANTS.SRS_LIMIT_EMPLOYMENT_PASS,
            currentContributions: 0,
            taxBracket: 15
          },
          opportunityCost: {
            monthlyPotentialSavings: srsAnalysis.taxSavings / 12,
            actionMessage: `Start monthly SRS to capture $${srsAnalysis.taxSavings.toLocaleString()} benefit`,
            urgencyMessage: `Missing potential tax savings each month`
          },
          employmentPassAdvantage: {
            srsLimitAdvantage: 20700,
            additionalTaxSavings: srsAnalysis.employmentPassAdvantage || 0,
            vsComparison: `Additional savings vs Citizens/PRs`
          }
        });
        
        console.log('✅ Using local AI insights as fallback');
      } catch (localError) {
        console.error('Local analysis also failed:', localError);
        setDynamicInsights([]);
        // Set safe default tax intelligence
        setTaxIntelligence({
          srsOptimization: {
            remainingRoom: FINANCIAL_CONSTANTS.SRS_LIMIT_EMPLOYMENT_PASS,
            taxSavings: 5000,
            daysToDeadline: 175,
            monthlyTarget: 2975,
            urgencyLevel: 'medium',
            maxContribution: FINANCIAL_CONSTANTS.SRS_LIMIT_EMPLOYMENT_PASS,
            currentContributions: 0,
            taxBracket: 15
          },
          opportunityCost: {
            monthlyPotentialSavings: 417,
            actionMessage: "Start SRS contributions for tax benefits",
            urgencyMessage: "Missing potential monthly tax savings"
          },
          employmentPassAdvantage: {
            srsLimitAdvantage: 20700,
            additionalTaxSavings: 3000,
            vsComparison: "Additional savings vs Citizens/PRs"
          }
        });
      }
    } finally {
      setInsightsLoading(false);
    }
  }, [holdings]);

  // Fetch intelligence from API
  const fetchIntelligence = useCallback(async () => {
    if (holdings.length === 0) return;
    
    setIntelligenceLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.INTELLIGENCE);
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
      await fetch(`${API_ENDPOINTS.INSIGHTS}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionType: insight.category || insight.type,
          insightId: insight.id,
          metadata: insight.data
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

  // Initialize holdings on mount - removed to prevent infinite loop
  // useEffect(() => {
  //   fetchHoldings();
  // }, [fetchHoldings]);

  // Fetch insights when holdings are loaded
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

  return {
    // Holdings data
    holdings,
    loading,
    fetchHoldings,
    
    // Insights data
    dynamicInsights,
    insightsLoading,
    insightsError,
    isInsightsLive,
    fetchDynamicInsights,
    
    // Intelligence data
    intelligence,
    intelligenceLoading,
    isIntelligenceLive,
    fetchIntelligence,
    
    // Tax intelligence
    taxIntelligence,
    
    // Action handler
    handleInsightAction
  };
}