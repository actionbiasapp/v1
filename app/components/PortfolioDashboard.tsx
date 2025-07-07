'use client';

import { useState, useEffect, useCallback } from 'react';
import NetWorthTracker from './NetWorthTracker';
import FixedPortfolioGrid from './FixedPortfolioGrid';
import { CurrencyToggleSimple } from './CurrencyToggle';
import { type CurrencyCode, CURRENCY_INFO, formatCurrency, getHoldingDisplayValue } from '@/app/lib/currency';

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
}

interface CategoryData {
  name: string;
  holdings: Holding[];
  currentValue: number;
  currentPercent: number;
  target: number;
  gap: number;
  gapAmount: number;
}

interface ActionItem {
  id: string;
  type: 'urgent' | 'opportunity' | 'optimization';
  problem: string;
  solution: string;
  benefit: string;
  urgency: string;
  actionText: string;
  isClickable: boolean;
}

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

  // Updated allocation targets
  const targets = {
    Core: 25,      // VUAA + Indian NIFTY ETFs
    Growth: 55,    // Individual stocks + ETH + alt crypto
    Hedge: 10,     // BTC + Gold + (future bonds)
    Liquidity: 10  // Cash + stablecoins
  };

  // Sample portfolio data fallback
  const sampleHoldings: Holding[] = [
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
  ];

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

  // Fetch holdings from database with fallback to sample data
  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    try {
      const response = await fetch('/api/holdings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure data is an array
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

  // Calculate total value in selected display currency
  const totalValue = Array.isArray(holdings) ? holdings.reduce((sum, holding) => {
    return sum + getHoldingDisplayValue(holding, displayCurrency);
  }, 0) : 0;

  const firstMillionProgress = (totalValue / 1000000) * 100;
  
  // Group holdings by category with multi-currency support
  const categoryData: CategoryData[] = Object.entries(targets).map(([categoryName, target]) => {
    const categoryHoldings = Array.isArray(holdings) ? holdings.filter(h => h.category === categoryName) : [];
    const currentValue = categoryHoldings.reduce((sum, h) => sum + getHoldingDisplayValue(h, displayCurrency), 0);
    const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    const gap = currentPercent - target;
    const targetValue = (target / 100) * totalValue;
    const gapAmount = currentValue - targetValue;

    return {
      name: categoryName,
      holdings: categoryHoldings,
      currentValue,
      currentPercent,
      target,
      gap,
      gapAmount
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
    const isUnder = category.gap < -2;
    const isOnTarget = Math.abs(category.gap) <= 2;

    let status: 'perfect' | 'underweight' | 'excess';
    let statusText: string;
    
    if (isOnTarget) {
      status = 'perfect';
      statusText = 'Perfect allocation';
    } else if (isUnder) {
      status = 'underweight';
      statusText = `Add ${formatCurrency(Math.abs(category.gapAmount), displayCurrency, { compact: true })} needed`;
    } else {
      status = 'excess';
      statusText = `Trim ${formatCurrency(Math.abs(category.gapAmount), displayCurrency, { compact: true })} excess`;
    }

    return {
      ...category,
      ...config,
      status,
      statusText,
      id: category.name
    };
  });

  // ACTION BIAS: Specific, actionable recommendations
  const actionItems: ActionItem[] = [
    {
      id: 'srs',
      type: 'urgent',
      problem: 'Missing $5,355 tax savings',
      solution: 'Buy $35,700 VUAA in SRS account',
      benefit: 'Save $5,355 in taxes (15% bracket)',
      urgency: 'Deadline: Dec 31, 2025',
      actionText: 'Open SRS Account',
      isClickable: true
    },
    {
      id: 'core-gap',
      type: 'opportunity', 
      problem: 'Core underweight by 4k',
      solution: 'Transfer from cash → Buy more VUAA or Indian ETFs',
      benefit: 'Reach target allocation, earn 7%/year',
      urgency: 'Execute this week',
      actionText: 'Transfer & Buy',
      isClickable: true
    },
    {
      id: 'growth-rebalance',
      type: 'optimization',
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
        {/* Header with Currency Switcher */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Action Bias Portfolio</h1>
          
          <CurrencyToggleSimple 
            displayCurrency={displayCurrency}
            onCurrencyChange={setDisplayCurrency}
          />
        </div>
        
        {/* Portfolio Header with Metrics */}
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
              <div>
                <p className="text-2xl font-bold text-blue-400">{firstMillionProgress.toFixed(1)}%</p>
                <p className="text-sm text-gray-400">of First Million</p>
              </div>
            </div>

            {/* Right: FI Progress Bar */}
            <div className="flex-1 ml-8">
              <div className="relative bg-gray-700 rounded-full h-4 mb-2">
                <div 
                  className="absolute h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full"
                  style={{ width: `${Math.min(firstMillionProgress, 100) * 0.4}%` }}
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

        <NetWorthTracker />

        {/* Portfolio Allocation with Fixed Portfolio Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">
            Portfolio Allocation
          </h2>
          <FixedPortfolioGrid
            categories={enhancedCategoryData}
            totalValue={totalValue}
            expandedCards={expandedCards}
            onToggleExpand={handleToggleExpand}
            displayCurrency={displayCurrency}
            onHoldingsUpdate={fetchHoldings}  // Add this line
          />
        </div>

        {/* Action Bias Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {actionItems.map(action => (
            <ActionBiasCard key={action.id} action={action} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Keep existing ActionBiasCard component unchanged
function ActionBiasCard({ action }: { action: ActionItem }) {
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

  return (
    <div className={`rounded-lg p-4 border ${getTypeColor()}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{getTypeIcon()}</span>
        <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300 uppercase font-medium">
          {action.type}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div>
          <span className="text-xs text-gray-400 block">PROBLEM:</span>
          <span className="text-sm text-red-300">{action.problem}</span>
        </div>
        
        <div>
          <span className="text-xs text-gray-400 block">SOLUTION:</span>
          <span className="text-sm text-white font-medium">{action.solution}</span>
        </div>
        
        <div>
          <span className="text-xs text-gray-400 block">BENEFIT:</span>
          <span className="text-sm text-green-300">{action.benefit}</span>
        </div>
        
        <div>
          <span className="text-xs text-gray-400 block">TIMELINE:</span>
          <span className="text-xs text-orange-300">{action.urgency}</span>
        </div>
      </div>

      {action.isClickable ? (
        <button className="w-full bg-white text-gray-900 py-2 px-4 rounded font-medium hover:bg-gray-100 transition-colors">
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