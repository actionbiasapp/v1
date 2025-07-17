'use client';

import { useState } from 'react';
import { YearlyData } from '@/app/lib/types/shared';
import NetWorthDataManager from '@/app/components/NetWorthDataManager';
import EditYearForm from '@/app/components/forms/EditYearForm';
import { 
  getChartDimensions, 
  getChartScaling, 
  generateAreaPath, 
  generateLinePath,
  getPointCoordinates,
  getBarDimensions
} from '@/app/lib/chartUtils';

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

  const [showDataManager, setShowDataManager] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingYear, setEditingYear] = useState<number | null>(null);
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

  // Chart setup using utilities
  const dimensions = getChartDimensions();
  const scaling = getChartScaling(yearlyData);
  
  // Recalculate market gains and return percentages for the entire dataset
  const recalculateMetrics = (data: YearlyData[]) => {
    return data.map((yearData, index) => {
      if (index === 0) {
        // First year: market gains = net worth - annual investment
        const marketGains = yearData.netWorth - yearData.annualInvestment;
        const returnPercent = yearData.annualInvestment > 0 ? 
          ((marketGains / yearData.annualInvestment) * 100) : 0;
        return { ...yearData, marketGains, returnPercent };
      } else {
        // Subsequent years: market gains = current net worth - previous net worth - annual investment
        const previousNetWorth = data[index - 1].netWorth;
        const marketGains = yearData.netWorth - previousNetWorth - yearData.annualInvestment;
        const returnPercent = previousNetWorth > 0 ? 
          ((marketGains / previousNetWorth) * 100) : 0;
        return { ...yearData, marketGains, returnPercent };
      }
    });
  };
  
  const addNewYear = (year: number, netWorth: number, annualInvestment: number) => {
    const newYearData = { year, netWorth, annualInvestment, marketGains: 0, returnPercent: 0 };
    const newData = [...yearlyData, newYearData].sort((a, b) => a.year - b.year);
    const recalculatedData = recalculateMetrics(newData);
    setYearlyData(recalculatedData);
  };

  const editYear = (year: number, netWorth: number, annualInvestment: number) => {
    const updatedData = yearlyData.map(data => 
      data.year === year 
        ? { ...data, netWorth, annualInvestment }
        : data
    );
    const recalculatedData = recalculateMetrics(updatedData);
    setYearlyData(recalculatedData);
    setShowEditForm(false);
    setEditingYear(null);
  };

  const deleteYear = (yearToDelete: number) => {
    if (yearlyData.length <= 1) {
      alert("Cannot delete the last remaining data point!");
      return;
    }
    
    if (confirm(`Are you sure you want to delete data for ${yearToDelete}?`)) {
      const filteredData = yearlyData.filter(data => data.year !== yearToDelete);
      const recalculatedData = recalculateMetrics(filteredData);
      setYearlyData(recalculatedData);
    }
  };

  const startEdit = (year: number) => {
    setEditingYear(year);
    setShowEditForm(true);
  };

  return (
    <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6 transition-all duration-300 hover:bg-slate-800/80 hover:scale-[1.01] shadow-sm hover:shadow-lg">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Net Worth Journey</h2>
          <p className="text-sm text-slate-400">Investment contributions vs market performance over time</p>
        </div>
        <div className="flex gap-3 items-center">
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
          </div>
          
          {/* Single Action Button */}
          <button
            onClick={() => setShowDataManager(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Manage Data
          </button>
        </div>
      </div>

      {/* Enhanced Chart */}
      <div className="bg-slate-900/50 rounded-lg p-4 mb-6 overflow-x-auto">
        <svg width="100%" height={dimensions.chartHeight} viewBox={`0 0 ${dimensions.chartWidth} ${dimensions.chartHeight}`} className="min-w-[800px]">
          <defs>
            {/* Gradient for net worth area */}
            <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6b7280', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#6b7280', stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
          
          {/* Fixed Grid lines with proper 100k increments */}
          {scaling.yAxisIncrements.map((value) => {
            const y = dimensions.padding + ((scaling.yAxisMax - value) / scaling.yAxisMax) * dimensions.plotHeight;
            return (
              <g key={value}>
                <line
                  x1={dimensions.padding}
                  y1={y}
                  x2={dimensions.chartWidth - dimensions.padding}
                  y2={y}
                  stroke="#374151"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.5"
                />
                <text
                  x={dimensions.padding - 15}
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
          
          {/* Net Worth Area Fill - Using chart utilities */}
          <path
            d={generateAreaPath(yearlyData, dimensions, scaling)}
            fill="url(#netWorthGradient)"
          />
          
          {/* Investment and Gains Bars */}
          {yearlyData.map((data, index) => {
            const { x, y: netWorthY } = getPointCoordinates(index, yearlyData, dimensions, scaling);
            const barDimensions = getBarDimensions(data, scaling, dimensions.chartHeight);
            
            // Smart text positioning to prevent overlap
            const isLowValue = data.netWorth < 100000;
            const netWorthTextY = isLowValue ? netWorthY + 20 : netWorthY - 15;
            
            return (
              <g key={data.year}>
                {/* Investment bar (blue) */}
                <rect
                  x={x - 8}
                  y={barDimensions.investmentY}
                  width="16"
                  height={barDimensions.investmentHeight}
                  fill="#6366f1"
                  opacity={hoveredIndex === index ? 1 : 0.8}
                  rx="2"
                  className="transition-opacity"
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* Market gains/losses bar */}
                <rect
                  x={x - 8}
                  y={barDimensions.gainsY}
                  width="16"
                  height={barDimensions.gainsHeight}
                  fill={barDimensions.barColor}
                  opacity={hoveredIndex === index ? 1 : 0.9}
                  rx="2"
                  className="transition-opacity"
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* FULL VERTICAL hover area covering entire year column */}
                <rect
                  x={x - 25}
                  y={dimensions.padding}
                  width="50"
                  height={dimensions.chartHeight - dimensions.padding - 80}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                />
                
                {/* Year label */}
                <text x={x} y={dimensions.chartHeight - 5} fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="500">
                  {data.year === 2025 ? '2025*' : data.year}
                </text>
                
                {/* Net worth */}
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
                      y={dimensions.chartHeight - 70}
                      width="50"
                      height="20"
                      fill="rgba(0,0,0,0.9)"
                      rx="10"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={dimensions.chartHeight - 57}
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
                      y={dimensions.chartHeight - 45}
                      width="60"
                      height="18"
                      fill="rgba(0,0,0,0.9)"
                      rx="9"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={dimensions.chartHeight - 33}
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
          
          {/* Net Worth Line - Using chart utilities */}
          <path
            d={generateLinePath(yearlyData, dimensions, scaling)}
            fill="none"
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Net Worth Points */}
          {yearlyData.map((data, index) => {
            const { x, y } = getPointCoordinates(index, yearlyData, dimensions, scaling);
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
          <text x={dimensions.chartWidth - 180} y={dimensions.padding - 20} fill="#64748b" fontSize="10" textAnchor="start">
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

      {/* Data Manager Modal */}
      {showDataManager && (
        <NetWorthDataManager 
          yearlyData={yearlyData}
          onAdd={addNewYear}
          onEdit={startEdit}
          onDelete={deleteYear}
          onClose={() => setShowDataManager(false)}
        />
      )}

      {/* Edit Year Form */}
      {showEditForm && editingYear && (
        <EditYearForm 
          yearlyData={yearlyData}
          editingYear={editingYear}
          onEdit={editYear}
          onCancel={() => {
            setShowEditForm(false);
            setEditingYear(null);
          }}
        />
      )}
    </div>
  );
}