'use client';

import { useState, useEffect } from 'react';

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

  // Updated allocation targets (80/20 growth/hedge approach)
  const targets = {
    Core: 25,      // VUAA + Indian NIFTY ETFs
    Growth: 55,    // Individual stocks + ETH + alt crypto
    Hedge: 10,     // BTC + Gold + (future bonds)
    Liquidity: 10  // Cash + stablecoins
  };

  // Fetch holdings from database
  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    try {
      const response = await fetch('/api/holdings');
      const data = await response.json();
      setHoldings(data);
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const firstMillionProgress = (totalValue / 1000000) * 100;
  
  // Group holdings by category
  const categoryData: CategoryData[] = Object.entries(targets).map(([categoryName, target]) => {
    const categoryHoldings = holdings.filter(h => h.category === categoryName);
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

  // ACTION BIAS: Specific, actionable recommendations with updated calculations
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
    setHoldings(prev => [...prev, { ...holding, id: Date.now().toString() }]);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading your portfolio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Action Bias Portfolio</h1>
        
        {/* Redesigned Header with Better Layout */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          {/* Top Row: Portfolio Metrics + FI Progress */}
          <div className="flex justify-between items-start mb-6">
            {/* Left: Four Portfolio Metrics in Equal Spacing */}
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

            {/* Right: Full-Width FI Progress Bar */}
            <div className="flex-1 ml-8">
              <div className="relative bg-gray-700 rounded-full h-4 mb-2">
                {/* First Million Progress (0 to 1M) */}
                <div 
                  className="absolute h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full"
                  style={{ width: `${Math.min(firstMillionProgress, 100) * 0.4}%` }}
                />
                
                {/* Lean FI Progress (1M to 1.85M) */}
                {totalValue > 1000000 && (
                  <div 
                    className="absolute h-4 bg-gradient-to-r from-yellow-500 to-yellow-400"
                    style={{ 
                      left: '40%',
                      width: `${Math.min(((totalValue - 1000000) / 850000) * 100, 100) * 0.34}%` 
                    }}
                  />
                )}
                
                {/* Full FI Progress (1.85M to 2.5M) */}
                {totalValue > 1850000 && (
                  <div 
                    className="absolute h-4 bg-gradient-to-r from-green-500 to-green-400 rounded-r-full"
                    style={{ 
                      left: '74%',
                      width: `${Math.min(((totalValue - 1850000) / 650000) * 100, 100) * 0.26}%` 
                    }}
                  />
                )}
                
                {/* Milestone markers */}
                <div className="absolute top-0 left-[40%] w-0.5 h-4 bg-white opacity-70"></div>
                <div className="absolute top-0 left-[74%] w-0.5 h-4 bg-white opacity-70"></div>
              </div>
              
              {/* Bar Labels */}
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>$0</span>
                <span>$1M</span>
                <span>$1.85M (Lean)</span>
                <span>$2.5M (Full FI)</span>
              </div>
              
              {/* Progress Info */}
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  ${(1000000 - totalValue).toLocaleString()} to first milestone
                </p>
              </div>
            </div>
          </div>

          {/* Status Table with Mini Pie Charts */}
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-400 border-b border-gray-600 pb-2">
              <span>STATUS</span>
              <span>VISUAL</span>
              <span>CURRENT</span>
              <span>TARGET</span>
              <span>GAP</span>
              <span>ACTION</span>
            </div>
            {categoryData.map(category => {
              const isOver = category.gap > 2;
              const isUnder = category.gap < -2;
              const isOnTarget = Math.abs(category.gap) <= 2;
              const statusIcon = isOver ? '🔴' : isUnder ? '🟠' : '✅';
              const gapText = isOver 
                ? `-$${Math.abs(category.gapAmount / 1000).toFixed(0)}k` 
                : isUnder 
                ? `+$${Math.abs(category.gapAmount / 1000).toFixed(0)}k`
                : 'Perfect';
              const actionText = isOver
                ? `Trim ${category.name.toLowerCase()}`
                : isUnder
                ? `Buy more ${category.name === 'Core' ? 'VUAA' : category.name.toLowerCase()}`
                : 'Hold steady';

              // Calculate pie chart percentages
              const targetValue = (category.target / 100) * totalValue;
              const currentPercent = Math.min((category.currentValue / targetValue) * 100, 100);
              const excessPercent = Math.max(((category.currentValue - targetValue) / targetValue) * 100, 0);

              return (
                <div key={category.name} className="grid grid-cols-6 gap-4 text-sm py-3 border-b border-gray-700 items-center">
                  <span className="flex items-center gap-2">
                    {statusIcon} {category.name}
                  </span>
                  
                  {/* Mini Pie Chart */}
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                      {/* Background circle */}
                      <circle cx="16" cy="16" r="12" fill="none" stroke="#374151" strokeWidth="4"/>
                      
                      {/* Current allocation (up to 100%) */}
                      <circle 
                        cx="16" cy="16" r="12" fill="none" 
                        stroke={isOnTarget ? '#10b981' : isUnder ? '#f59e0b' : '#ef4444'}
                        strokeWidth="4"
                        strokeDasharray={`${currentPercent * 0.75} 75`}
                        strokeLinecap="round"
                      />
                      
                      {/* Excess (over 100%) */}
                      {excessPercent > 0 && (
                        <circle 
                          cx="16" cy="16" r="8" fill="none" 
                          stroke="#dc2626"
                          strokeWidth="2"
                          strokeDasharray={`${Math.min(excessPercent * 0.5, 50)} 50`}
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                  </div>
                  
                  <span className="font-medium">${(category.currentValue / 1000).toFixed(0)}k</span>
                  <span>${((category.target / 100) * totalValue / 1000).toFixed(0)}k</span>
                  <span className={`font-medium ${
                    isOver ? 'text-red-400' : isUnder ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    {gapText}
                  </span>
                  <span className="text-gray-400">{actionText}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Bias Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {actionItems.map(action => (
            <ActionBiasCard key={action.id} action={action} />
          ))}
        </div>

        {/* Fixed Holdings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {categoryData.map(category => (
            <CategoryCard 
              key={category.name}
              category={category}
              totalValue={totalValue}
            />
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

function CategoryCard({ category, totalValue }: { category: CategoryData; totalValue: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const targetValue = (category.target / 100) * totalValue;
  const isOverweight = category.gap > 2;
  const isUnderweight = category.gap < -2;
  const isOnTarget = Math.abs(category.gap) <= 2;

  const getCategoryIcon = () => {
    const icons = { Core: '🔵', Growth: '🟢', Hedge: '🟡', Liquidity: '⚪' };
    return icons[category.name as keyof typeof icons] || '⚪';
  };

  const getCardBorder = () => {
    if (isOnTarget) return 'border-green-500/30';
    if (isOverweight) return 'border-red-500/30';
    return 'border-orange-500/30';
  };

  const getAssetIcon = (symbol: string) => {
    const icons: { [key: string]: string } = {
      'NVDA': '🟢', 'GOOG': '🔵', 'TSLA': '🔴', 'BTC': '🟠', 'ETH': '⚪',
      'VUAA': '📈', 'SGD': '🇸🇬', 'USDC': '💵', 'GOLD': '🥇', 'INDIA': '🇮🇳'
    };
    return icons[symbol] || '📊';
  };

  const maxVisibleHoldings = isExpanded ? category.holdings.length : 4;

  return (
    <div 
      className={`bg-gray-800 rounded-lg p-4 border ${getCardBorder()} transition-all duration-300`}
      style={{ 
        minHeight: isExpanded ? 'auto' : '200px',
        // Prevent horizontal expansion issues
        gridColumn: 'span 1'
      }}
    >
      {/* Header - Clickable */}
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{getCategoryIcon()}</span>
          <div>
            <h3 className="text-sm font-semibold text-white">{category.name.toUpperCase()}</h3>
            <p className="text-xs text-gray-400">
              ${(category.currentValue / 1000).toFixed(0)}k / ${(targetValue / 1000).toFixed(0)}k
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">
            ${(category.currentValue / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-gray-400">{category.currentPercent.toFixed(1)}%</p>
          <p className="text-xs text-blue-400">{isExpanded ? '▲' : '▼'}</p>
        </div>
      </div>

      {/* Status */}
      <div className={`text-xs font-medium mb-3 ${
        isOnTarget ? 'text-green-400' : isOverweight ? 'text-red-400' : 'text-orange-400'
      }`}>
        {isOnTarget && '✅ Perfect allocation'}
        {isOverweight && `🔴 Trim ${Math.abs(category.gapAmount / 1000).toFixed(0)}k excess`}
        {isUnderweight && `🟠 Add ${Math.abs(category.gapAmount / 1000).toFixed(0)}k needed`}
      </div>

      {/* Holdings List - Expand Vertically Only */}
      <div className="space-y-2 overflow-hidden">
        {category.holdings.slice(0, maxVisibleHoldings).map(holding => (
          <div key={holding.id} className="flex justify-between items-center text-xs py-1">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span>{getAssetIcon(holding.symbol)}</span>
              <span className="text-white font-medium truncate">{holding.symbol}</span>
              <span className="text-gray-500 text-xs truncate">({holding.location})</span>
            </div>
            <span className="text-white ml-2">${(holding.value / 1000).toFixed(0)}k</span>
          </div>
        ))}
        
        {!isExpanded && category.holdings.length > 4 && (
          <div className="text-xs text-gray-500 text-center cursor-pointer hover:text-blue-400 py-1">
            +{category.holdings.length - 4} more (click to expand)
          </div>
        )}
      </div>
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