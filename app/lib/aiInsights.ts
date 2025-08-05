import { Holding } from "./types/shared.js";
// app/lib/aiInsights.ts - Portfolio Analysis Engine
import { type CurrencyCode } from './currency';
import { DEFAULT_ALLOCATION_TARGETS } from './constants';

// Use the constants for allocation targets
const ALLOCATION_TARGETS = DEFAULT_ALLOCATION_TARGETS;

// Helper function to round to 2 decimal places
const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

// Helper function to convert currency with 2 decimal places
const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  // Approximate conversion rates
  const rates = {
    'USD_TO_SGD': 1.35,
    'INR_TO_SGD': 1/63,
    'SGD_TO_USD': 1/1.35,
    'SGD_TO_INR': 63
  };

  if (fromCurrency === toCurrency) return roundToTwoDecimals(amount);
  
  if (fromCurrency === 'USD' && toCurrency === 'SGD') {
    return roundToTwoDecimals(amount * rates.USD_TO_SGD);
  }
  if (fromCurrency === 'INR' && toCurrency === 'SGD') {
    return roundToTwoDecimals(amount * rates.INR_TO_SGD);
  }
  if (fromCurrency === 'SGD' && toCurrency === 'USD') {
    return roundToTwoDecimals(amount * rates.SGD_TO_USD);
  }
  if (fromCurrency === 'SGD' && toCurrency === 'INR') {
    return roundToTwoDecimals(amount * rates.SGD_TO_INR);
  }
  
  return roundToTwoDecimals(amount); // Default to original amount
};

export const generatePerformanceInsights = (holdings: any[]): any[] => {
  const insights = [];
  
  for (const holding of holdings) {
    if (!holding.quantity || !holding.unitPrice) continue;
    
    // Convert cost basis to SGD for consistent comparison
    let costBasisSGD = holding.costBasis;
    if (holding.costBasisCurrency && holding.costBasisCurrency !== 'SGD') {
      costBasisSGD = convertCurrency(holding.costBasis, holding.costBasisCurrency, 'SGD');
    }
    
    // Calculate current value (assuming current price is same as unit price for now)
    const currentValue = roundToTwoDecimals(Number(holding.quantity) * Number(holding.unitPrice));
    const currentValueSGD = convertCurrency(currentValue, holding.currency || 'USD', 'SGD');
    
    // Calculate performance
    const performance = roundToTwoDecimals(((currentValueSGD - costBasisSGD) / costBasisSGD) * 100);
    
    if (Math.abs(performance) > 5) { // Only show significant performance
      insights.push({
        type: 'performance',
        title: `${holding.symbol} Performance Review`,
        description: `${holding.symbol} is ${performance > 0 ? 'up' : 'down'} ${Math.abs(performance).toFixed(0)}%`,
        severity: performance > 0 ? 'positive' : 'negative',
        action: performance > 0 ? 'Consider taking profits' : 'Review position',
        symbol: holding.symbol,
        performance: performance
      });
    }
  }
  
  return insights;
};

export const generateAllocationInsights = (holdings: any[]): any[] => {
  const insights: any[] = [];
  const categoryTotals: { [key: string]: number } = {};
  let totalValue = 0;
  
  // Calculate total value and category totals
  for (const holding of holdings) {
    if (!holding.quantity || !holding.unitPrice) continue;
    
    const value = roundToTwoDecimals(Number(holding.quantity) * Number(holding.unitPrice));
    const valueSGD = convertCurrency(value, holding.currency || 'USD', 'SGD');
    
    const category = holding.category?.name || 'Unknown';
    categoryTotals[category] = (categoryTotals[category] || 0) + valueSGD;
    totalValue += valueSGD;
  }
  
  if (totalValue === 0) return insights;
  
  // Compare with targets
  for (const [category, value] of Object.entries(categoryTotals)) {
    const target = (ALLOCATION_TARGETS as any)[category] || 0;
    const currentPercentage = roundToTwoDecimals((value / totalValue) * 100);
    const targetPercentage = target;
    const gap = roundToTwoDecimals(currentPercentage - targetPercentage);
    
    if (Math.abs(gap) > 5) { // Only show significant gaps
      insights.push({
        type: 'allocation',
        title: `${category} Allocation`,
        description: `${category} is ${gap > 0 ? 'overweight' : 'underweight'} by ${Math.abs(gap).toFixed(0)}%`,
        severity: Math.abs(gap) > 10 ? 'high' : 'medium',
        action: gap > 0 ? 'Consider rebalancing' : 'Consider adding to this category',
        category: category,
        currentPercentage: currentPercentage,
        targetPercentage: targetPercentage,
        gap: gap
      });
    }
  }
  
  return insights;
};

export const generateConcentrationInsights = (holdings: any[]): any[] => {
  const insights: any[] = [];
  let totalValue = 0;
  const holdingValues: { symbol: string; value: number; percentage: number }[] = [];
  
  // Calculate total value and individual holding values
  for (const holding of holdings) {
    if (!holding.quantity || !holding.unitPrice) continue;
    
    const value = roundToTwoDecimals(Number(holding.quantity) * Number(holding.unitPrice));
    const valueSGD = convertCurrency(value, holding.currency || 'USD', 'SGD');
    
    totalValue += valueSGD;
    holdingValues.push({
      symbol: holding.symbol,
      value: valueSGD,
      percentage: 0 // Will calculate below
    });
  }
  
  if (totalValue === 0) return insights;
  
  // Calculate percentages and find concentrated positions
  for (const holding of holdingValues) {
    holding.percentage = roundToTwoDecimals((holding.value / totalValue) * 100);
    
    if (holding.percentage > 20) { // More than 20% in single holding
      insights.push({
        type: 'concentration',
        title: `${holding.symbol} Concentration Risk`,
        description: `${holding.symbol} represents ${holding.percentage.toFixed(0)}% of your portfolio`,
        severity: holding.percentage > 30 ? 'high' : 'medium',
        action: 'Consider diversifying this position',
        symbol: holding.symbol,
        percentage: holding.percentage
      });
    }
  }
  
  return insights;
};

export const generateCashDragInsights = (holdings: any[]): any[] => {
  const insights: any[] = [];
  let totalValue = 0;
  let cashValue = 0;
  
  // Calculate total value and cash value
  for (const holding of holdings) {
    if (!holding.quantity || !holding.unitPrice) continue;
    
    const value = roundToTwoDecimals(Number(holding.quantity) * Number(holding.unitPrice));
    const valueSGD = convertCurrency(value, holding.currency || 'USD', 'SGD');
    
    totalValue += valueSGD;
    
    // Identify cash holdings (typically have unit price of 1)
    if (Number(holding.unitPrice) === 1 || holding.assetType === 'cash') {
      cashValue += valueSGD;
    }
  }
  
  if (totalValue === 0) return insights;
  
  const cashPercentage = roundToTwoDecimals((cashValue / totalValue) * 100);
  
  if (cashPercentage > 10) { // More than 10% in cash
    insights.push({
      type: 'cash_drag',
      title: 'Cash Drag Alert',
      description: `${cashPercentage.toFixed(0)}% of your portfolio is in cash`,
      severity: cashPercentage > 20 ? 'high' : 'medium',
      action: 'Consider investing excess cash',
      cashPercentage: cashPercentage
    });
  }
  
  return insights;
};

export const generatePortfolioInsights = (holdings: any[]): any[] => {
  const performanceInsights = generatePerformanceInsights(holdings);
  const allocationInsights = generateAllocationInsights(holdings);
  const concentrationInsights = generateConcentrationInsights(holdings);
  const cashDragInsights = generateCashDragInsights(holdings);
  
  return [
    ...performanceInsights,
    ...allocationInsights,
    ...concentrationInsights,
    ...cashDragInsights
  ];
};

export function generateComprehensiveInsights(
  holdings: Holding[],
  displayCurrency: CurrencyCode = 'SGD'
): any[] {
  // Use the existing generatePortfolioInsights function
  return generatePortfolioInsights(holdings);
}

// Utility functions
export function formatCurrency(amount: number, currency: CurrencyCode = 'SGD'): string {
  const formatter = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function calculatePortfolioMetrics(holdings: Holding[]): {
  totalValue: number;
  categoryBreakdown: Record<string, number>;
  topHoldings: Holding[];
  diversificationScore: number;
} {
  const totalValue = holdings.reduce((sum, h) => sum + h.valueSGD, 0);
  
  const categoryBreakdown = holdings.reduce((acc, holding) => {
    acc[holding.category] = (acc[holding.category] || 0) + holding.valueSGD;
    return acc;
  }, {} as Record<string, number>);
  
  const topHoldings = holdings
    .sort((a, b) => b.valueSGD - a.valueSGD)
    .slice(0, 5);
  
  // Simple diversification score based on number of holdings and concentration
  const holdingCount = holdings.length;
  const largestPosition = Math.max(...holdings.map(h => h.valueSGD));
  const largestConcentration = (largestPosition / totalValue) * 100;
  const diversificationScore = Math.min(100, (holdingCount * 5) - largestConcentration);
  
  return {
    totalValue,
    categoryBreakdown,
    topHoldings,
    diversificationScore
  };
}