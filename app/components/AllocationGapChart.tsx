'use client';

import { CategoryData } from '@/app/lib/types/shared';
import { type CurrencyCode } from '@/app/lib/currency';

interface AllocationGapChartProps {
  categories: CategoryData[];
  className?: string;
}

// Color mapping from existing system
const COLOR_MAP = {
  'bg-blue-500': { main: '#3b82f6', light: '#60a5fa', border: '#1d4ed8' },
  'bg-green-500': { main: '#10b981', light: '#34d399', border: '#059669' },
  'bg-yellow-500': { main: '#f59e0b', light: '#fbbf24', border: '#d97706' },
  'bg-purple-500': { main: '#8b5cf6', light: '#a78bfa', border: '#7c3aed' }
};

// Status colors for gap indication
const STATUS_COLORS = {
  perfect: '#10b981', // green-500
  underweight: '#f59e0b', // yellow-500  
  excess: '#ef4444' // red-500
};

export default function AllocationGapChart({ categories, className = '' }: AllocationGapChartProps) {
  // Filter out categories with 0% allocation for cleaner chart
  const activeCategories = categories.filter(cat => cat.currentPercent > 0 || cat.target > 0);
  
  if (activeCategories.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium mb-2">Portfolio Allocation</p>
          <p className="text-sm">Add holdings to see allocation chart</p>
        </div>
      </div>
    );
  }

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

  // SVG dimensions
  const size = 300;
  const center = size / 2;
  const outerRadius = 110;
  const innerRadius = 70;
  const currentRadius = 90;

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
    <div className={`bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Allocation vs Target</h3>
        <div className="text-xs text-gray-400">Current vs Target %</div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8">
        {/* Chart */}
        <div className="flex-shrink-0 mx-auto lg:mx-0">
          <svg width={size} height={size} className="w-full max-w-[300px] h-auto">
            {/* Target allocation (outer ring) */}
            {segments.map((segment, index) => {
              const colors = COLOR_MAP[segment.color as keyof typeof COLOR_MAP] || COLOR_MAP['bg-blue-500'];
              const targetPath = createArcPath(segment.startAngle, segment.endAngle, innerRadius, outerRadius);
              
              return (
                <g key={`target-${index}`}>
                  <path
                    d={targetPath}
                    fill={colors.main}
                    opacity={0.3}
                    stroke={colors.border}
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* Current allocation (inner ring) */}
            {segments.map((segment, index) => {
              const colors = COLOR_MAP[segment.color as keyof typeof COLOR_MAP] || COLOR_MAP['bg-blue-500'];
              const currentAngleSize = (segment.currentPercent / 100) * 360;
              const currentPath = createArcPath(segment.startAngle, segment.startAngle + currentAngleSize, innerRadius, currentRadius);
              
              return (
                <g key={`current-${index}`}>
                  <path
                    d={currentPath}
                    fill={colors.main}
                    opacity={0.8}
                    stroke={STATUS_COLORS[segment.status]}
                    strokeWidth="2"
                  />
                </g>
              );
            })}

            {/* Center content */}
            <circle cx={center} cy={center} r={innerRadius} fill="#374151" />
            <text x={center} y={center - 10} textAnchor="middle" className="text-sm font-medium fill-white">
              Portfolio
            </text>
            <text x={center} y={center + 10} textAnchor="middle" className="text-xs fill-gray-400">
              Allocation
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 mt-4 lg:mt-0 lg:flex-1">
          {activeCategories.map((category, index) => {
            const colors = COLOR_MAP[category.color as keyof typeof COLOR_MAP] || COLOR_MAP['bg-blue-500'];
            
            return (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2"
                    style={{ 
                      backgroundColor: colors.main,
                      borderColor: STATUS_COLORS[category.status]
                    }}
                  />
                  <span className="text-lg">{category.icon}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{category.name}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      category.status === 'perfect' ? 'bg-green-900/50 text-green-300' :
                      category.status === 'underweight' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {category.statusText}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{category.currentPercent.toFixed(1)}% current</span>
                    <span>{category.target}% target</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Summary */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {activeCategories.filter(c => c.status === 'perfect').length} on target, {' '}
            {activeCategories.filter(c => c.status === 'underweight').length} underweight, {' '}
            {activeCategories.filter(c => c.status === 'excess').length} overweight
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            Perfect
            <div className="w-2 h-2 rounded-full bg-yellow-400 ml-2"></div>
            Under
            <div className="w-2 h-2 rounded-full bg-red-400 ml-2"></div>
            Over
          </span>
        </div>
      </div>
    </div>
  );
}