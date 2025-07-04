'use client';

import { useState } from 'react';

interface YearlyData {
  year: number;
  netWorth: number;
  annualInvestment: number;
  marketGains: number; // calculated field
  returnPercent: number; // calculated field
}

export default function NetWorthTracker() {
  // Your actual data with corrected timeline + market gains calculated
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([
    { year: 2018, netWorth: 21200, annualInvestment: 20000, marketGains: 1200, returnPercent: 6.0 },
    { year: 2019, netWorth: 113547, annualInvestment: 75303, marketGains: 17044, returnPercent: 18.2 },
    { year: 2020, netWorth: 269083, annualInvestment: 78316, marketGains: 77220, returnPercent: 40.4 },
    { year: 2021, netWorth: 578896, annualInvestment: 71600, marketGains: 238197, returnPercent: 115.1 },
    { year: 2022, netWorth: 346000, annualInvestment: 26000, marketGains: -232896, returnPercent: -40.2 },
    { year: 2023, netWorth: 385530, annualInvestment: 20000, marketGains: 19530, returnPercent: 11.4 },
    { year: 2024, netWorth: 520000, annualInvestment: 30000, marketGains: 104470, returnPercent: 34.9 },
    { year: 2025, netWorth: 487000, annualInvestment: 30000, marketGains: -33000, returnPercent: -6.3 }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate key metrics
  const totalInvested = yearlyData.reduce((sum, data) => sum + data.annualInvestment, 0);
  const currentNetWorth = yearlyData[yearlyData.length - 1]?.netWorth || 0;
  const totalGains = currentNetWorth - totalInvested;
  const totalReturn = totalInvested > 0 ? ((totalGains / totalInvested) * 100) : 0;
  
  // Find best and worst years
  const bestYear = yearlyData.reduce((best, current) => 
    current.returnPercent > best.returnPercent ? current : best
  );
  
  const worstYear = yearlyData.reduce((worst, current) => 
    current.returnPercent < worst.returnPercent ? current : worst
  );

  // Chart dimensions and scaling
  const chartWidth = 800;
  const chartHeight = 320; // Increased height for year labels below
  const padding = 90; // Increased left padding for Y-axis labels
  const plotWidth = chartWidth - 2 * padding;
  const plotHeight = chartHeight - 120; // More space for labels below
  
  // Fixed Y-axis: proper 100k increments
  const yAxisMax = 600000; // 600k max
  const yAxisIncrements = [0, 100000, 200000, 300000, 400000, 500000, 600000];
  
  const maxInvestment = 80000; // Standard max for scaling
  const maxGains = Math.max(...yearlyData.map(d => Math.abs(d.marketGains)));
  
  // Scale for investment bars (relative to max investment)
  const investmentScale = 80; // Max height for investment bars
  const gainsScale = 120; // Max height for gains/losses
  
  // Get bar color based on gains
  const getBarColor = (marketGains: number) => {
    return marketGains >= 0 ? "#10b981" : "#ef4444";
  };
  
  const addNewYear = (year: number, netWorth: number, annualInvestment: number) => {
    // Calculate market gains
    const previousNetWorth = yearlyData.find(d => d.year === year - 1)?.netWorth || 0;
    const marketGains = netWorth - previousNetWorth - annualInvestment;
    const returnPercent = previousNetWorth > 0 ? ((marketGains / previousNetWorth) * 100) : 0;
    
    const newData = [...yearlyData, { year, netWorth, annualInvestment, marketGains, returnPercent }]
      .sort((a, b) => a.year - b.year);
    setYearlyData(newData);
    setShowAddForm(false);
  };

  return (
    <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6 transition-all duration-300 hover:bg-slate-800/80 hover:scale-[1.01] shadow-sm hover:shadow-lg">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Net Worth Journey</h2>
          <p className="text-sm text-slate-400">Investment contributions vs market performance over time</p>
        </div>
        <div className="flex gap-4 items-center">
          {/* Legend */}
          <div className="hidden md:flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-500 rounded-sm"></div>
              <span className="text-slate-400">Net Worth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
              <span className="text-slate-400">Investment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
              <span className="text-slate-400">Gains</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span className="text-slate-400">Losses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-slate-400">% Return</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Add Year
          </button>
        </div>
      </div>

      {/* Enhanced Chart */}
      <div className="bg-slate-900/50 rounded-lg p-4 mb-6 overflow-x-auto">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[800px]">
          <defs>
            {/* Gradient for net worth area */}
            <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6b7280', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#6b7280', stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
          
          {/* Fixed Grid lines with proper 100k increments */}
          {yAxisIncrements.map((value) => {
            const y = padding + ((yAxisMax - value) / yAxisMax) * plotHeight;
            return (
              <g key={value}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#374151"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.5"
                />
                <text
                  x={padding - 15}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="end"
                >
                  {value === 0 ? '0' : `${value / 1000}k`}
                </text>
              </g>
            );
          })}
          
          {/* Net Worth Area Fill */}
          <path
            d={`M ${padding} ${padding + plotHeight} ${yearlyData.map((data, index) => {
              const x = padding + (index / (yearlyData.length - 1)) * plotWidth;
              const y = padding + ((yAxisMax - data.netWorth) / yAxisMax) * plotHeight;
              return `L ${x} ${y}`;
            }).join(' ')} L ${padding + plotWidth} ${padding + plotHeight} Z`}
            fill="url(#netWorthGradient)"
          />
          
          {/* Investment and Gains Bars */}
          {yearlyData.map((data, index) => {
            const x = padding + (index / (yearlyData.length - 1)) * plotWidth;
            const netWorthY = padding + ((yAxisMax - data.netWorth) / yAxisMax) * plotHeight;
            
            // Investment bar height calculation
            const investmentHeight = (data.annualInvestment / maxInvestment) * investmentScale;
            const investmentY = chartHeight - 100 - investmentHeight; // More space below
            
            // Market gains/losses bar
            const gainsHeight = Math.abs(data.marketGains / maxGains) * gainsScale;
            const gainsY = data.marketGains >= 0 ? investmentY - gainsHeight : investmentY;
            const barColor = getBarColor(data.marketGains);
            
            // Smart text positioning to prevent overlap
            const isLowValue = data.netWorth < 100000; // Values under 100k
            const netWorthTextY = isLowValue ? netWorthY + 20 : netWorthY - 15; // Below for low values, above for high
            
            return (
              <g key={data.year}>
                {/* Investment bar (blue) - moved BEFORE hover area */}
                <rect
                  x={x - 8}
                  y={investmentY}
                  width="16"
                  height={investmentHeight}
                  fill="#6366f1"
                  opacity={hoveredIndex === index ? 1 : 0.8}
                  rx="2"
                  className="transition-opacity"
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* Market gains/losses bar - moved BEFORE hover area */}
                <rect
                  x={x - 8}
                  y={gainsY}
                  width="16"
                  height={gainsHeight}
                  fill={barColor}
                  opacity={hoveredIndex === index ? 1 : 0.9}
                  rx="2"
                  className="transition-opacity"
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* FULL VERTICAL hover area covering entire year column - AFTER bars */}
                <rect
                  x={x - 25}
                  y={padding}
                  width="50"
                  height={chartHeight - padding - 80}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                />
                
                {/* Year label - BELOW X-axis with proper spacing */}
                <text x={x} y={chartHeight - 5} fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="500">
                  {data.year === 2025 ? '2025*' : data.year}
                </text>
                
                {/* Net worth - positioned above the gray net worth marker */}
                <text 
                  x={x} 
                  y={netWorthTextY} 
                  fill="white" 
                  fontSize="11" 
                  textAnchor="middle" 
                  fontWeight="bold"
                  className="transition-colors"
                  style={{ pointerEvents: 'none' }}
                >
                  ${(data.netWorth / 1000).toFixed(0)}k
                </text>
                
                {/* Return percentage and gains - ONLY on HOVER */}
                {hoveredIndex === index && (
                  <g style={{ pointerEvents: 'none' }}>
                    {/* Return percentage with dark background */}
                    <rect
                      x={x - 25}
                      y={chartHeight - 70}
                      width="50"
                      height="20"
                      fill="rgba(0,0,0,0.9)"
                      rx="10"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={chartHeight - 57}
                      fill={data.returnPercent >= 0 ? "#10b981" : "#ef4444"}
                      fontSize="11"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {data.returnPercent >= 0 ? '+' : ''}{data.returnPercent.toFixed(0)}%
                    </text>
                    
                    {/* Market gains value */}
                    <rect
                      x={x - 30}
                      y={chartHeight - 45}
                      width="60"
                      height="18"
                      fill="rgba(0,0,0,0.9)"
                      rx="9"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={chartHeight - 33}
                      fill={data.marketGains >= 0 ? "#10b981" : "#ef4444"}
                      fontSize="10"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {data.marketGains >= 0 ? '+' : ''}${(data.marketGains / 1000).toFixed(0)}k
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          
          {/* Net Worth Line */}
          <path
            d={`M ${yearlyData.map((data, index) => {
              const x = padding + (index / (yearlyData.length - 1)) * plotWidth;
              const y = padding + ((yAxisMax - data.netWorth) / yAxisMax) * plotHeight;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}`}
            fill="none"
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Net Worth Points */}
          {yearlyData.map((data, index) => {
            const x = padding + (index / (yearlyData.length - 1)) * plotWidth;
            const y = padding + ((yAxisMax - data.netWorth) / yAxisMax) * plotHeight;
            return (
              <circle
                key={`point-${data.year}`}
                cx={x}
                cy={y}
                r={hoveredIndex === index ? "5" : "4"}
                fill="#6b7280"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all"
                style={{ pointerEvents: 'none' }}
              />
            );
          })}
          
          {/* Instructions */}
          <text x={chartWidth - 180} y={padding - 20} fill="#64748b" fontSize="10" textAnchor="start">
            Hover bars for percentage and gains details
          </text>
        </svg>
        
        <div className="text-center text-xs text-slate-500 mt-2">
          * 2025 as on date
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-indigo-400">
            ${(currentNetWorth / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-slate-400">Current Net Worth</div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            ${(totalInvested / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-slate-400">Total Invested</div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${totalGains >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalGains >= 0 ? '+' : ''}${(totalGains / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-slate-400">Total Gains</div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className={`text-lg font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Total Return</div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">
            {bestYear.year}
          </div>
          <div className="text-xs text-slate-400">Best Year (+{bestYear.returnPercent.toFixed(0)}%)</div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-400">
            {worstYear.year}
          </div>
          <div className="text-xs text-slate-400">Worst Year ({worstYear.returnPercent.toFixed(0)}%)</div>
        </div>
      </div>

      {/* Add New Year Form */}
      {showAddForm && (
        <AddYearForm onAdd={addNewYear} onCancel={() => setShowAddForm(false)} />
      )}
    </div>
  );
}

function AddYearForm({ onAdd, onCancel }: { 
  onAdd: (year: number, netWorth: number, annualInvestment: number) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    netWorth: '',
    annualInvestment: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(
      parseInt(formData.year),
      parseFloat(formData.netWorth),
      parseFloat(formData.annualInvestment)
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Add New Year Data</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Net Worth ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.netWorth}
              onChange={(e) => setFormData({ ...formData, netWorth: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Annual Investment ($)</label>
            <input
              type="number"
              step="0.01"
              value={formData.annualInvestment}
              onChange={(e) => setFormData({ ...formData, annualInvestment: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Add Year
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}