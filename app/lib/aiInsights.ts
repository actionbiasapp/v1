// app/lib/aiInsights.ts - Portfolio Analysis Engine
import { type CurrencyCode } from './currency';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  valueSGD: number;
  valueINR: number;
  valueUSD: number;
  entryCurrency: string;
  category: string;
  location: string;
  quantity?: number;
  costBasis?: number;
}

interface CategoryAnalysis {
  name: string;
  holdings: Holding[];
  currentValue: number;
  currentPercent: number;
  targetPercent: number;
  gap: number;
  gapAmount: number;
  status: 'perfect' | 'underweight' | 'overweight';
  priority: number;
}

interface PortfolioInsight {
  id: string;
  type: 'urgent' | 'opportunity' | 'optimization';
  category: string;
  title: string;
  problem: string;
  solution: string;
  benefit: string;
  dollarImpact: number;
  timeline: string;
  actionText: string;
  priority: number;
  isClickable: boolean;
  metadata?: any;
}

export type { PortfolioInsight };

// Portfolio allocation targets
const ALLOCATION_TARGETS = {
  Core: 25,
  Growth: 55,
  Hedge: 10,
  Liquidity: 10
};

export function analyzePortfolioAllocation(
  holdings: Holding[],
  displayCurrency: CurrencyCode = 'SGD'
): CategoryAnalysis[] {
  const totalValue = holdings.reduce((sum, h) => sum + h.valueSGD, 0);
  
  return Object.entries(ALLOCATION_TARGETS).map(([categoryName, targetPercent]) => {
    const categoryHoldings = holdings.filter(h => h.category === categoryName);
    const currentValue = categoryHoldings.reduce((sum, h) => sum + h.valueSGD, 0);
    const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    const gap = currentPercent - targetPercent;
    const targetValue = (targetPercent / 100) * totalValue;
    const gapAmount = currentValue - targetValue;
    
    let status: 'perfect' | 'underweight' | 'overweight';
    let priority: number;
    
    if (Math.abs(gap) <= 2) {
      status = 'perfect';
      priority = 1;
    } else if (gap < -2) {
      status = 'underweight';
      priority = Math.abs(gap) > 10 ? 8 : 6;
    } else {
      status = 'overweight';
      priority = gap > 10 ? 9 : 7;
    }

    return {
      name: categoryName,
      holdings: categoryHoldings,
      currentValue,
      currentPercent,
      targetPercent,
      gap,
      gapAmount,
      status,
      priority
    };
  });
}

export function generateCashDragInsights(
  categories: CategoryAnalysis[],
  totalValue: number
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];
  
  const liquidityCategory = categories.find(c => c.name === 'Liquidity');
  if (liquidityCategory && liquidityCategory.gap > 2) {
    const excessCash = Math.abs(liquidityCategory.gapAmount);
    const annualOpportunityCost = excessCash * 0.07; // 7% expected return
    const monthlyOpportunityCost = annualOpportunityCost / 12;
    
    // Find underweight categories for redeployment
    const underweightCategories = categories.filter(c => c.status === 'underweight');
    const redeploymentTarget = underweightCategories.length > 0 
      ? underweightCategories[0].name 
      : 'Growth';
    
    insights.push({
      id: 'cash-drag-analysis',
      type: 'opportunity',
      category: 'allocation',
      title: 'Excess Cash Drag',
      problem: `${(excessCash/1000).toFixed(0)}k excess cash earning minimal returns`,
      solution: `Redeploy ${(excessCash/1000).toFixed(0)}k to ${redeploymentTarget} category`,
      benefit: `Earn ${(annualOpportunityCost/1000).toFixed(0)}k additional annual returns`,
      dollarImpact: annualOpportunityCost,
      timeline: 'Execute this week',
      actionText: `Deploy ${(excessCash/1000).toFixed(0)}k Cash`,
      priority: 9,
      isClickable: true,
      metadata: {
        excessAmount: excessCash,
        targetCategory: redeploymentTarget,
        monthlyOpportunityCost: monthlyOpportunityCost
      }
    });
  }
  
  return insights;
}

export function generateAllocationInsights(
  categories: CategoryAnalysis[],
  totalValue: number
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];
  
  categories.forEach(category => {
    if (category.status === 'underweight' && Math.abs(category.gapAmount) > 5000) {
      const underweightAmount = Math.abs(category.gapAmount);
      const expectedReturn = underweightAmount * 0.07; // 7% expected return
      
      insights.push({
        id: `${category.name.toLowerCase()}-underweight`,
        type: 'opportunity',
        category: 'allocation',
        title: `${category.name} Underweight`,
        problem: `${category.name} ${category.gap.toFixed(1)}% below target allocation`,
        solution: `Add ${(underweightAmount/1000).toFixed(0)}k to ${category.name} holdings`,
        benefit: `Optimize risk-adjusted returns and reduce concentration`,
        dollarImpact: expectedReturn,
        timeline: 'Next month',
        actionText: `Add to ${category.name}`,
        priority: 8,
        isClickable: true,
        metadata: {
          currentPercent: category.currentPercent,
          targetPercent: category.targetPercent,
          gapAmount: category.gapAmount
        }
      });
    }
    
    if (category.status === 'overweight' && category.gap > 5) {
      const overweightAmount = Math.abs(category.gapAmount);
      
      insights.push({
        id: `${category.name.toLowerCase()}-overweight`,
        type: 'optimization',
        category: 'allocation',
        title: `${category.name} Overweight`,
        problem: `${category.name} ${category.gap.toFixed(1)}% above target allocation`,
        solution: `Reduce ${category.name} position by ${(overweightAmount/1000).toFixed(0)}k`,
        benefit: `Improve portfolio balance and reduce concentration risk`,
        dollarImpact: overweightAmount * 0.02, // Risk reduction value
        timeline: 'Next rebalancing',
        actionText: `Rebalance ${category.name}`,
        priority: 7,
        isClickable: true,
        metadata: {
          currentPercent: category.currentPercent,
          targetPercent: category.targetPercent,
          excessAmount: overweightAmount
        }
      });
    }
  });
  
  return insights;
}

export function generateConcentrationInsights(
  holdings: Holding[],
  totalValue: number
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];
  
  // Check for individual position concentration
  holdings.forEach(holding => {
    const concentration = (holding.valueSGD / totalValue) * 100;
    
    if (concentration > 15) { // Over 15% in single position
      const riskReduction = holding.valueSGD * 0.05; // Risk reduction value
      
      insights.push({
        id: `concentration-${holding.symbol}`,
        type: concentration > 20 ? 'urgent' : 'optimization',
        category: 'risk',
        title: `${holding.symbol} Concentration Risk`,
        problem: `${holding.symbol} represents ${concentration.toFixed(1)}% of portfolio`,
        solution: `Consider reducing ${holding.symbol} position size`,
        benefit: `Reduce concentration risk and improve diversification`,
        dollarImpact: riskReduction,
        timeline: 'Next rebalancing',
        actionText: `Reduce ${holding.symbol}`,
        priority: concentration > 20 ? 10 : 7,
        isClickable: true,
        metadata: {
          concentration: concentration,
          holdingValue: holding.valueSGD,
          symbol: holding.symbol
        }
      });
    }
  });
  
  // Check for location concentration
  const locationConcentration = holdings.reduce((acc, holding) => {
    acc[holding.location] = (acc[holding.location] || 0) + holding.valueSGD;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(locationConcentration).forEach(([location, value]) => {
    const concentration = (value / totalValue) * 100;
    
    if (concentration > 40) { // Over 40% in single location
      insights.push({
        id: `location-concentration-${location}`,
        type: 'optimization',
        category: 'risk',
        title: `${location} Location Risk`,
        problem: `${concentration.toFixed(1)}% of portfolio in ${location}`,
        solution: `Consider diversifying across multiple brokers/locations`,
        benefit: `Reduce counterparty risk and improve security`,
        dollarImpact: value * 0.02, // Risk reduction value
        timeline: 'Consider for new investments',
        actionText: `Diversify Locations`,
        priority: 6,
        isClickable: true,
        metadata: {
          location: location,
          concentration: concentration,
          value: value
        }
      });
    }
  });
  
  return insights;
}

export function generatePerformanceInsights(
  holdings: Holding[],
  totalValue: number
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];
  
  // Check for holdings with cost basis for performance analysis
  const holdingsWithCostBasis = holdings.filter(h => h.costBasis && h.costBasis > 0);
  
  holdingsWithCostBasis.forEach(holding => {
    const gainLoss = holding.valueSGD - holding.costBasis!;
    const gainLossPercent = (gainLoss / holding.costBasis!) * 100;
    
    // Significant losses (>20%) might warrant review
    if (gainLossPercent < -20) {
      insights.push({
        id: `performance-${holding.symbol}`,
        type: 'optimization',
        category: 'performance',
        title: `${holding.symbol} Performance Review`,
        problem: `${holding.symbol} down ${Math.abs(gainLossPercent).toFixed(1)}% from cost basis`,
        solution: `Review ${holding.symbol} position and consider rebalancing`,
        benefit: `Optimize portfolio performance and tax efficiency`,
        dollarImpact: Math.abs(gainLoss),
        timeline: 'Review this month',
        actionText: `Review ${holding.symbol}`,
        priority: 5,
        isClickable: true,
        metadata: {
          gainLoss: gainLoss,
          gainLossPercent: gainLossPercent,
          costBasis: holding.costBasis
        }
      });
    }
  });
  
  return insights;
}

export function generateComprehensiveInsights(
  holdings: Holding[],
  displayCurrency: CurrencyCode = 'SGD'
): PortfolioInsight[] {
  const totalValue = holdings.reduce((sum, h) => sum + h.valueSGD, 0);
  const categories = analyzePortfolioAllocation(holdings, displayCurrency);
  
  const allInsights: PortfolioInsight[] = [];
  
  // Generate all types of insights
  allInsights.push(...generateCashDragInsights(categories, totalValue));
  allInsights.push(...generateAllocationInsights(categories, totalValue));
  allInsights.push(...generateConcentrationInsights(holdings, totalValue));
  allInsights.push(...generatePerformanceInsights(holdings, totalValue));
  
  // Sort by priority (highest first) and return top 6
  return allInsights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);
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