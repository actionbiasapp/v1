// app/lib/chartUtils.ts
// SVG chart generation utilities extracted from NetWorthTracker

import { YearlyData } from '@/app/lib/types/shared';

export interface ChartDimensions {
  chartWidth: number;
  chartHeight: number;
  padding: number;
  plotWidth: number;
  plotHeight: number;
}

export interface ChartScaling {
  yAxisMax: number;
  yAxisIncrements: number[];
  maxInvestment: number;
  maxGains: number;
  investmentScale: number;
  gainsScale: number;
}

/**
 * Get default chart dimensions
 */
export function getChartDimensions(): ChartDimensions {
  const chartWidth = 800;
  const chartHeight = 320;
  const padding = 90;
  
  return {
    chartWidth,
    chartHeight,
    padding,
    plotWidth: chartWidth - 2 * padding,
    plotHeight: chartHeight - 120
  };
}

/**
 * Get chart scaling parameters based on data
 */
export function getChartScaling(yearlyData: YearlyData[]): ChartScaling {
  const yAxisMax = 600000;
  const yAxisIncrements = [0, 100000, 200000, 300000, 400000, 500000, 600000];
  const maxInvestment = 80000;
  const maxGains = Math.max(...yearlyData.map(d => Math.abs(d.marketGains)));
  
  return {
    yAxisMax,
    yAxisIncrements,
    maxInvestment,
    maxGains,
    investmentScale: 80,
    gainsScale: 120
  };
}

/**
 * Generate SVG area path for net worth visualization
 */
export function generateAreaPath(
  yearlyData: YearlyData[], 
  dimensions: ChartDimensions,
  scaling: ChartScaling
): string {
  if (!yearlyData || yearlyData.length === 0) return '';
  
  const { padding, plotWidth, plotHeight } = dimensions;
  const { yAxisMax } = scaling;
  
  // Start from bottom-left corner
  let path = `M ${padding} ${padding + plotHeight}`;
  
  // Add line points
  yearlyData.forEach((data, index) => {
    const x = padding + (index / (yearlyData.length - 1)) * plotWidth;
    const y = padding + ((yAxisMax - data.netWorth) / yAxisMax) * plotHeight;
    
    // Validate coordinates
    if (isFinite(x) && isFinite(y)) {
      path += ` L ${x} ${y}`;
    }
  });
  
  // Close path to bottom-right corner
  path += ` L ${padding + plotWidth} ${padding + plotHeight} Z`;
  
  return path;
}

/**
 * Generate SVG line path for net worth line
 */
export function generateLinePath(
  yearlyData: YearlyData[], 
  dimensions: ChartDimensions,
  scaling: ChartScaling
): string {
  if (!yearlyData || yearlyData.length === 0) return '';
  
  const { padding, plotWidth, plotHeight } = dimensions;
  const { yAxisMax } = scaling;
  
  return yearlyData.map((data, index) => {
    const x = padding + (index / (yearlyData.length - 1)) * plotWidth;
    const y = padding + ((yAxisMax - data.netWorth) / yAxisMax) * plotHeight;
    
    // Validate coordinates and return proper command
    if (isFinite(x) && isFinite(y)) {
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }
    return '';
  }).filter(cmd => cmd !== '').join(' ');
}

/**
 * Get bar color based on market gains
 */
export function getBarColor(marketGains: number): string {
  return marketGains >= 0 ? "#10b981" : "#ef4444";
}

/**
 * Calculate point coordinates for a data point
 */
export function getPointCoordinates(
  dataIndex: number,
  yearlyData: YearlyData[],
  dimensions: ChartDimensions,
  scaling: ChartScaling
): { x: number; y: number } {
  const { padding, plotWidth, plotHeight } = dimensions;
  const { yAxisMax } = scaling;
  
  const data = yearlyData[dataIndex];
  const x = padding + (dataIndex / (yearlyData.length - 1)) * plotWidth;
  const y = padding + ((yAxisMax - data.netWorth) / yAxisMax) * plotHeight;
  
  return { x, y };
}

/**
 * Calculate bar heights and positions for investment and gains visualization
 */
export function getBarDimensions(
  data: YearlyData,
  scaling: ChartScaling,
  chartHeight: number
): {
  investmentHeight: number;
  investmentY: number;
  gainsHeight: number;
  gainsY: number;
  barColor: string;
} {
  const { maxInvestment, maxGains, investmentScale, gainsScale } = scaling;
  
  // Investment bar height calculation
  const investmentHeight = (data.annualInvestment / maxInvestment) * investmentScale;
  const investmentY = chartHeight - 100 - investmentHeight;
  
  // Market gains/losses bar
  const gainsHeight = Math.abs(data.marketGains / maxGains) * gainsScale;
  const gainsY = data.marketGains >= 0 ? investmentY - gainsHeight : investmentY;
  const barColor = getBarColor(data.marketGains);
  
  return {
    investmentHeight,
    investmentY,
    gainsHeight,
    gainsY,
    barColor
  };
}