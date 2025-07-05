'use client';

import { useState, useEffect, useCallback } from 'react';
import NetWorthTracker from './NetWorthTracker';
import DraggablePortfolioGrid from './DraggablePortfolioGrid'; // ← FIXED: Only import what we use

interface Holding {
  id: string;
  symbol: string;
  name: string;
  value: number;
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
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Updated allocation targets (80/20 growth/hedge approach)
  const targets = {
    Core: 25,      // VUAA + Indian NIFTY ETFs
    Growth: 55,    // Individual stocks + ETH + alt crypto
    Hedge: 10,     // BTC + Gold + (future bonds)
    Liquidity: 10  // Cash + stablecoins
  };

  // TEMPORARY: Sample portfolio data to restore your portfolio
  const sampleHoldings: Holding[] = [
    // Core Holdings
    { id: '1', symbol: 'VUAA', name: 'Vanguard S&P 500', value: 53000, category: 'Core', location: 'IBKR' },
    { id: '2', symbol: 'INDIA', name: 'Indian ETF', value: 64000, category: 'Core', location: 'ICICI Direct' },
    
    // Growth Holdings
    { id: '3', symbol: 'NVDA', name: 'NVIDIA Corporation', value: 20000, category: 'Growth', location: 'IBKR' },
    { id: '4', symbol: 'GOOG', name: 'Alphabet Inc', value: 18000, category: 'Growth', location: 'IBKR' },
    { id: '5', symbol: 'TSLA', name: 'Tesla Inc', value: 18000, category: 'Growth', location: 'IBKR' },
    { id: '6', symbol: 'IREN', name: 'Iris Energy', value: 4000, category: 'Growth', location: 'IBKR' },
    { id: '7', symbol: 'HIMS', name: 'Hims & Hers Health', value: 15000, category: 'Growth', location: 'IBKR' },
    { id: '8', symbol: 'UNH', name: 'UnitedHealth Group', value: 12000, category: 'Growth', location: 'IBKR' },
    { id: '9', symbol: 'AAPL', name: 'Apple Inc', value: 25000, category: 'Growth', location: 'IBKR' },
    { id: '10', symbol: 'AMGN', name: 'Amgen Inc', value: 8000, category: 'Growth', location: 'IBKR' },
    { id: '11', symbol: 'CRM', name: 'Salesforce', value: 6000, category: 'Growth', location: 'IBKR' },
    { id: '12', symbol: 'ETH', name: 'Ethereum', value: 48000, category: 'Growth', location: 'CoinGecko' },
    
    // Hedge Holdings
    { id: '13', symbol: 'BTC', name: 'Bitcoin', value: 58000, category: 'Hedge', location: 'CoinGecko' },
    { id: '14', symbol: 'WBTC', name: 'Wrapped Bitcoin', value: 17000, category: 'Hedge', location: 'CoinGecko' },
    { id: '15', symbol: 'GOLD', name: 'Physical Gold', value: 14000, category: 'Hedge', location: 'Physical' },
    
    // Liquidity Holdings
    { id: '16', symbol: 'SGD', name: 'Singapore Dollar', value: 44000, category: 'Liquidity', location: 'Standard Chartered' },
    { id: '17', symbol: 'SGD', name: 'Singapore Dollar', value: 30000, category: 'Liquidity', location: 'DBS Bank' },
    { id: '18', symbol: 'USDC', name: 'USD Coin', value: 30000, category: 'Liquidity', location: 'Aave' },
    { id: '19', symbol: 'USDC', name: 'USD Coin', value: 3000, category: 'Liquidity', location: 'Binance' }
  ];

  const handleToggleExpand = useCallback((categoryName: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      console.log('Toggling:', categoryName, 'New set:', newSet);
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
        setHoldings(sampleHoldings); // Use sample data as fallback
      }
    } catch (error) {
      console.error('Error fetching holdings, using sample data:', error);
      setHoldings(sampleHoldings); // Use sample data as fallback
    } finally {
      setLoading(false);
    }
  };

  // Safe calculation with fallback for empty holdings
  const totalValue = Array.isArray(holdings) ? holdings.reduce((sum, holding) => sum + holding.value, 0) : 0;
  const firstMillionProgress = (totalValue / 1000000) * 100;
  
  // Group holdings by category with safe array handling
  const categoryData: CategoryData[] = Object.entries(targets).map(([categoryName, target]) => {
    const categoryHoldings = Array.isArray(holdings) ? holdings.filter(h => h.category === categoryName) : [];
    const currentValue = categoryHoldings.reduce((sum, h) => sum + h.value, 0);
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
        color: '#10b981',
        description: 'Individual growth stocks and emerging technologies'
      },
      Hedge: {
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        ),
        color: '#f59e0b', 
        description: 'Alternative assets providing portfolio protection'
      },
      Liquidity: {
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>
          </svg>
        ),
        color: '#64748b',
        description: 'Cash and cash equivalents for opportunities'
      }
    };

    const config = categoryConfig[category.name as keyof typeof categoryConfig];
    const isUnder = category.gap < -2;
    const isOnTarget = Math.abs(category.gap) <= 2;

    // FIXED: Proper TypeScript typing for status
    let status: 'perfect' | 'underweight' | 'excess';
    let statusText: string;
    
    if (isOnTarget) {
      status = 'perfect';
      statusText = 'Perfect allocation';
    } else if (isUnder) {
      status = 'underweight';
      statusText = `Add ${Math.abs(category.gapAmount / 1000).toFixed(0)}k needed`;
    } else {
      status = 'excess';
      statusText = `Trim ${Math.abs(category.gapAmount / 1000).toFixed(0)}k excess`;
    }

    return {
      ...category,
      ...config,
      status,
      statusText,
      id: category.name // Ensure unique ID
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
      problem: 'Core underweight by $4k',
      solution: 'Transfer $4k from cash → Buy more VUAA or Indian ETFs',
      benefit: 'Reach target allocation, earn 7%/year',
      urgency: 'Execute this week',
      actionText: 'Transfer & Buy',
      isClickable: true
    },
    {
      id: 'growth-rebalance',
      type: 'optimization',
      problem: 'Growth slightly overweight',
      solution: 'Consider trimming $20k from top performers when rebalancing',
      benefit: 'Maintain optimal risk balance',
      urgency: 'Next quarterly review',
      actionText: 'Plan Rebalance',
      isClickable: false
    }
  ];

  const addHolding = (holding: Omit<Holding, 'id'>) => {
    setHoldings(prev => {
      // Ensure prev is an array
      const currentHoldings = Array.isArray(prev) ? prev : [];
      return [...currentHoldings, { ...holding, id: Date.now().toString() }];
    });
    setShowAddForm(false);
  };

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
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Refresh Page
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Holdings Manually
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="mt-6">
              <AddHoldingForm onAdd={addHolding} onCancel={() => setShowAddForm(false)} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Action Bias Portfolio</h1>

        <NetWorthTracker />
        
        {/* Portfolio Header with Metrics */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex justify-between items-start mb-6">
            {/* Left: Portfolio Metrics */}
            <div className="flex gap-8">
              <div>
                <p className="text-4xl font-bold text-green-400">${totalValue.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Portfolio Value</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">$350,000</p>
                <p className="text-sm text-gray-400">Total Savings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">$136,810</p>
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
                <span>$0</span>
                <span>$1M</span>
                <span>$1.85M (Lean)</span>
                <span>$2.5M (Full FI)</span>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  ${(1000000 - totalValue).toLocaleString()} to first milestone
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* UPDATED: Portfolio Allocation with Drag & Drop */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
            Portfolio Allocation
            <span className="text-sm text-gray-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
              ✨ Drag to reorder
            </span>
          </h2>
          <DraggablePortfolioGrid
            categories={enhancedCategoryData}
            totalValue={totalValue}
            expandedCards={expandedCards}
            onToggleExpand={handleToggleExpand}
          />
        </div>

        {/* Action Bias Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {actionItems.map(action => (
            <ActionBiasCard key={action.id} action={action} />
          ))}
        </div>

        {/* Add Holding */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Add Holdings</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Holding
            </button>
          </div>

          {showAddForm && (
            <AddHoldingForm onAdd={addHolding} onCancel={() => setShowAddForm(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

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

function AddHoldingForm({ onAdd, onCancel }: { onAdd: (holding: Omit<Holding, 'id'>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    value: '',
    category: 'Core',
    location: 'IBKR'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      symbol: formData.symbol,
      name: formData.name,
      value: parseFloat(formData.value),
      category: formData.category,
      location: formData.location
    });
    setFormData({ symbol: '', name: '', value: '', category: 'Core', location: 'IBKR' });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="Symbol"
          value={formData.symbol}
          onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
          className="bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          required
        />
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          required
        />
        <input
          type="number"
          placeholder="Value (SGD)"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          className="bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          required
        />
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="Core">Core</option>
          <option value="Growth">Growth</option>
          <option value="Hedge">Hedge</option>
          <option value="Liquidity">Liquidity</option>
        </select>
        <select
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="bg-gray-600 text-white border border-gray-500 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="IBKR">IBKR</option>
          <option value="CoinGecko">CoinGecko</option>
          <option value="DBS Bank">DBS Bank</option>
          <option value="Standard Chartered">Standard Chartered</option>
          <option value="Binance">Binance</option>
          <option value="Aave">Aave</option>
          <option value="Physical">Physical</option>
          <option value="ICICI Direct">ICICI Direct</option>
        </select>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
          Add
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}