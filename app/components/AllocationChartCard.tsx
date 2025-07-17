'use client';

import { CategoryData } from '@/app/lib/types/shared';

interface AllocationChartCardProps {
  categories: CategoryData[];
  onToggleView: () => void;
}

// Color mapping from existing system
const COLOR_MAP = {
  'bg-blue-500': { main: '#3b82f6', light: '#60a5fa' },
  'bg-green-500': { main: '#10b981', light: '#34d399' },
  'bg-yellow-500': { main: '#f59e0b', light: '#fbbf24' },
  'bg-purple-500': { main: '#8b5cf6', light: '#a78bfa' }
};

// Status colors for gap indication
const STATUS_COLORS = {
  perfect: '#10b981', // green-500
  underweight: '#f59e0b', // yellow-500  
  excess: '#ef4444' // red-500
};

export default function AllocationChartCard({ categories, onToggleView }: AllocationChartCardProps) {
  // Filter out categories with 0% allocation
  const activeCategories = categories.filter(cat => cat.currentPercent > 0 || cat.target > 0);
  
  // Calculate summary stats
  const perfectCount = activeCategories.filter(c => c.status === 'perfect').length;
  const underCount = activeCategories.filter(c => c.status === 'underweight').length;
  const overCount = activeCategories.filter(c => c.status === 'excess').length;

  // SVG dimensions for mini chart
  const size = 120;
  const center = size / 2;
  const outerRadius = 50;
  const innerRadius = 35;

  // Calculate angles for each segment
  let currentAngle = 0;
  const segments = activeCategories.map(category => {
    const targetAngle = (category.target / 100) * 360;
    const currentStartAngle = currentAngle;
    currentAngle += targetAngle;
    
    return {
      ...category,
      startAngle: currentStartAngle,
      endAngle: currentAngle,
      targetAngle
    };
  });

  // Generate SVG path for donut segment
  const createArcPath = (startAngle: number, endAngle: number, innerR: number, outerR: number) => {
    const startAngleRad = (startAngle - 90) * Math.PI / 180;
    const endAngleRad = (endAngle - 90) * Math.PI / 180;
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    const x1 = center + outerR * Math.cos(startAngleRad);
    const y1 = center + outerR * Math.sin(startAngleRad);
    const x2 = center + outerR * Math.cos(endAngleRad);
    const y2 = center + outerR * Math.sin(endAngleRad);
    
    const x3 = center + innerR * Math.cos(endAngleRad);
    const y3 = center + innerR * Math.sin(endAngleRad);
    const x4 = center + innerR * Math.cos(startAngleRad);
    const y4 = center + innerR * Math.sin(startAngleRad);
    
    return [
      "M", x1, y1,
      "A", outerR, outerR, 0, largeArcFlag, 1, x2, y2,
      "L", x3, y3,
      "A", innerR, innerR, 0, largeArcFlag, 0, x4, y4,
      "Z"
    ].join(" ");
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-full flex flex-col">
      {/* Card Header - matching other cards */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <div>
            <h3 className="text-lg font-semibold text-white">Allocation</h3>
            <p className="text-xs text-gray-400">Overview</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Mini Donut Chart */}
        <div className="mb-4">
          <svg width={size} height={size} className="drop-shadow-sm">
            {/* Current allocation segments */}
            {segments.map((segment, index) => {
              const colors = COLOR_MAP[segment.color as keyof typeof COLOR_MAP] || COLOR_MAP['bg-blue-500'];
              const currentAngleSize = (segment.currentPercent / 100) * 360;
              const currentPath = createArcPath(segment.startAngle, segment.startAngle + currentAngleSize, innerRadius, outerRadius);
              
              return (
                <g key={`current-${index}`}>
                  <path
                    d={currentPath}
                    fill={colors.main}
                    stroke={STATUS_COLORS[segment.status]}
                    strokeWidth="2"
                    className="transition-all duration-200 hover:brightness-110"
                  />
                </g>
              );
            })}

            {/* Center content */}
            <circle cx={center} cy={center} r={innerRadius} fill="#374151" />
            <text x={center} y={center - 5} textAnchor="middle" className="text-xs font-medium fill-white">
              Portfolio
            </text>
            <text x={center} y={center + 8} textAnchor="middle" className="text-xs fill-gray-400">
              Status
            </text>
          </svg>
        </div>

        {/* Status Summary */}
        <div className="text-center space-y-2 mb-4">
          <div className="flex items-center justify-center gap-4 text-sm">
            {perfectCount > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                {perfectCount} On Target
              </span>
            )}
            {underCount > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                {underCount} Under
              </span>
            )}
            {overCount > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                {overCount} Over
              </span>
            )}
          </div>

          {/* Key imbalances */}
          <div className="text-xs text-gray-400 space-y-1">
            {activeCategories
              .filter(cat => Math.abs(cat.gap) > 5)
              .slice(0, 2)
              .map(cat => (
                <div key={cat.name} className="flex items-center justify-between">
                  <span>{cat.icon} {cat.name}</span>
                  <span className={cat.gap > 0 ? 'text-red-400' : 'text-yellow-400'}>
                    {cat.gap > 0 ? '+' : ''}{cat.gap.toFixed(1)}%
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Toggle Button - matching other card buttons */}
      <button
        onClick={onToggleView}
        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        View Details
      </button>
    </div>
  );
}