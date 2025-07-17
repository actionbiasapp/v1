// /app/lib/portfolioIntelligence.ts - Simplified Portfolio Intelligence Engine (MVP)
// 80/20 optimization: Focus on core value, eliminate over-engineering

import { type CurrencyCode, getHoldingDisplayValue } from './currency';
import { 
  calculateSRSOptimization, 
  calculateTaxBracket,
  generateTaxIntelligence 
} from './singaporeTax';
import { type Holding } from './types/shared';

// Simplified interfaces - removed over-engineering
export interface UserProfile {
  id: string;
  taxStatus: 'Employment Pass' | 'Citizen' | 'PR';
  estimatedIncome: number;
  currentSRSContributions: number;
  fiGoal: number;
  fiTargetYear: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface CategoryAnalysis {
  name: string;
  holdings: Holding[];
  currentValue: number;
  currentPercent: number;
  target: number;
  gap: number;
  gapAmount: number;
  status: 'perfect' | 'underweight' | 'excess';
  callout: string;
  priority: number;
}

export interface ActionItem {
  id: string;
  type: 'urgent' | 'opportunity' | 'optimization';
  title: string;
  description: string;
  dollarImpact: number;
  timeline: string;
  actionText: string;
  priority: number;
  category: string;
}

export interface PortfolioIntelligenceReport {
  statusIntelligence: {
    fiProgress: string;
    urgentAction: string;
    deadline: string | null;
    netWorth: number;
  };
  allocationIntelligence: CategoryAnalysis[];
  actionIntelligence: ActionItem[];
  narrativeIntelligence: {
    primaryMessage: string;
    tone: 'celebration' | 'urgency' | 'guidance' | 'reassurance';
    supportingMessages: string[];
  };
  employmentPassIntel?: {
    srsOpportunity: any;
    etfTaxEfficiency: any;
    advantageValue: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  generated: string;
  nextRefresh: string;
}

// Portfolio category targets (Core 25%, Growth 55%, Hedge 10%, Liquidity 10%)
const ALLOCATION_TARGETS = {
  Core: 25,
  Growth: 55, 
  Hedge: 10,
  Liquidity: 10
};

/**
 * Main Portfolio Intelligence Function (SIMPLIFIED)
 * Analyzes portfolio state and generates intelligent insights
 * Zero AI API costs - pure algorithmic analysis
 */
export function analyzePortfolioIntelligence(
  holdings: Holding[],
  user: UserProfile,
  displayCurrency: CurrencyCode = 'SGD'
): PortfolioIntelligenceReport {
  
  // Calculate portfolio metrics
  const totalValue = holdings.reduce((sum, h) => sum + getHoldingDisplayValue(h, displayCurrency), 0);
  const fiProgress = calculateFIProgress(totalValue, user.fiGoal);
  
  // Analyze allocation status
  const allocationAnalysis = analyzePortfolioAllocation(holdings, displayCurrency);
  
  // Generate opportunities and actions
  const opportunities = detectPortfolioOpportunities(allocationAnalysis, totalValue, user);
  
  // Employment Pass specific analysis (SIMPLIFIED - import from singaporeTax)
  const employmentPassIntel = user.taxStatus === 'Employment Pass' 
    ? analyzeEmploymentPassAdvantages(user)
    : undefined;
  
  // Generate narrative (MASSIVELY SIMPLIFIED)
  const narrative = generateSimpleNarrative({
    fiProgress,
    allocationAnalysis,
    opportunities,
    employmentPassIntel,
    totalValue
  });
  
  // Generate status intelligence
  const statusIntelligence = generateStatusIntelligence(
    fiProgress,
    opportunities,
    employmentPassIntel
  );
  
  return {
    statusIntelligence: {
      ...statusIntelligence,
      netWorth: totalValue
    },
    allocationIntelligence: allocationAnalysis,
    actionIntelligence: opportunities.slice(0, 3), // Top 3 actions
    narrativeIntelligence: narrative,
    employmentPassIntel,
    generated: new Date().toISOString(),
    nextRefresh: new Date(Date.now() + 3600000).toISOString() // 1 hour cache
  };
}

/**
 * Analyze portfolio allocation vs targets (SIMPLIFIED - removed from aiInsights duplication)
 */
function analyzePortfolioAllocation(
  holdings: Holding[], 
  displayCurrency: CurrencyCode
): CategoryAnalysis[] {
  const totalValue = holdings.reduce((sum, h) => sum + getHoldingDisplayValue(h, displayCurrency), 0);
  
  return Object.entries(ALLOCATION_TARGETS).map(([categoryName, target]) => {
    const categoryHoldings = holdings.filter(h => h.category === categoryName);
    const currentValue = categoryHoldings.reduce((sum, h) => sum + getHoldingDisplayValue(h, displayCurrency), 0);
    const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    const gap = currentPercent - target;
    const targetValue = (target / 100) * totalValue;
    const gapAmount = currentValue - targetValue;
    
    // Determine status
    let status: 'perfect' | 'underweight' | 'excess';
    if (Math.abs(gap) <= 2) status = 'perfect';
    else if (gap < -2) status = 'underweight';
    else status = 'excess';
    
    // Generate callout message (SIMPLIFIED)
    const callout = generateSimpleCallout(categoryName, status, gap, Math.abs(gapAmount));
    
    // Calculate priority (higher gap = higher priority)
    const priority = Math.abs(gap) > 5 ? 10 : Math.abs(gap) > 2 ? 7 : 3;

    return {
      name: categoryName,
      holdings: categoryHoldings,
      currentValue,
      currentPercent,
      target,
      gap,
      gapAmount,
      status,
      callout,
      priority
    };
  });
}

/**
 * Generate simple callouts (SIMPLIFIED - removed complex logic)
 */
function generateSimpleCallout(
  category: string, 
  status: 'perfect' | 'underweight' | 'excess',
  gap: number,
  gapAmount: number
): string {
  switch (status) {
    case 'perfect':
      return `Perfect allocation ✅`;
    case 'underweight':
      return `${Math.abs(gap).toFixed(1)}% below target 📈`;
    case 'excess':
      if (category === 'Liquidity' && gap > 10) {
        return `Excess cash - deploy to investments 🚨`;
      }
      return `${gap.toFixed(1)}% above target ⚖️`;
    default:
      return `Review allocation`;
  }
}

/**
 * Calculate FI progress metrics (SIMPLIFIED)
 */
function calculateFIProgress(currentNetWorth: number, fiGoal: number) {
  const percentToFirstMillion = Math.min((currentNetWorth / 1000000) * 100, 100);
  const percentToFIGoal = (currentNetWorth / fiGoal) * 100;
  const remainingToFirstMillion = Math.max(1000000 - currentNetWorth, 0);
  const remainingToFIGoal = Math.max(fiGoal - currentNetWorth, 0);
  
  return {
    currentNetWorth,
    fiGoal,
    percentToFirstMillion,
    percentToFIGoal,
    remainingToFirstMillion,
    remainingToFIGoal,
    isFirstMillionComplete: currentNetWorth >= 1000000,
    isFIComplete: currentNetWorth >= fiGoal
  };
}

/**
 * Detect portfolio opportunities (SIMPLIFIED - focus on high-impact items)
 */
function detectPortfolioOpportunities(
  categories: CategoryAnalysis[],
  totalValue: number,
  user: UserProfile
): ActionItem[] {
  const opportunities: ActionItem[] = [];
  
  // 1. Cash drag analysis (highest priority)
  const liquidityCategory = categories.find(c => c.name === 'Liquidity');
  if (liquidityCategory && liquidityCategory.gap > 5) {
    const excessCash = Math.abs(liquidityCategory.gapAmount);
    const opportunityCost = excessCash * 0.07; // 7% expected return
    
    opportunities.push({
      id: 'cash-drag',
      type: 'opportunity',
      title: 'Deploy Excess Cash',
      description: `${(excessCash/1000).toFixed(0)}k excess cash earning 0% returns`,
      dollarImpact: opportunityCost,
      timeline: 'This week',
      actionText: 'Deploy Cash',
      priority: 9,
      category: 'allocation'
    });
  }
  
  // 2. Major allocation gaps only (SIMPLIFIED - removed minor ones)
  categories.forEach(category => {
    if (category.status === 'underweight' && Math.abs(category.gapAmount) > 10000) {
      opportunities.push({
        id: `${category.name.toLowerCase()}-underweight`,
        type: 'opportunity',
        title: `Increase ${category.name} Allocation`,
        description: `${category.name} underweight by ${Math.abs(category.gapAmount/1000).toFixed(0)}k`,
        dollarImpact: Math.abs(category.gapAmount) * 0.02,
        timeline: 'Next month',
        actionText: `Add to ${category.name}`,
        priority: 8,
        category: 'allocation'
      });
    }
  });
  
  // 3. Major concentration risks only (SIMPLIFIED - removed minor risks)
  categories.forEach(category => {
    category.holdings.forEach(holding => {
      const concentration = (holding.valueSGD / totalValue) * 100;
      
      if (concentration > 20) { // Only major concentrations
        opportunities.push({
          id: `concentration-${holding.symbol}`,
          type: 'urgent',
          title: `Reduce ${holding.symbol} Concentration`,
          description: `${holding.symbol} is ${concentration.toFixed(1)}% of portfolio`,
          dollarImpact: holding.valueSGD * 0.05,
          timeline: 'Next rebalancing',
          actionText: 'Reduce Position',
          priority: 10,
          category: 'risk'
        });
      }
    });
  });
  
  return opportunities.sort((a, b) => b.priority - a.priority);
}

/**
 * Generate status bar intelligence (SIMPLIFIED)
 */
function generateStatusIntelligence(
  fiProgress: any,
  opportunities: ActionItem[],
  employmentPassIntel?: any
) {
  const fiProgressText = `${fiProgress.percentToFirstMillion.toFixed(1)}% to first million`;
  const urgentAction = opportunities[0]?.title || 'Portfolio optimized';
  const deadline = employmentPassIntel?.srsOpportunity?.deadline || null;
  
  return {
    fiProgress: fiProgressText,
    urgentAction,
    deadline
  };
}

/**
 * Generate simple narrative (MASSIVELY SIMPLIFIED - removed complex tone logic)
 */
function generateSimpleNarrative(context: {
  fiProgress: any;
  allocationAnalysis: CategoryAnalysis[];
  opportunities: ActionItem[];
  employmentPassIntel?: any;
  totalValue: number;
}): any {
  
  const { fiProgress, allocationAnalysis, opportunities, employmentPassIntel } = context;
  
  // Simple message priority: Urgent actions > Progress > General guidance
  let primaryMessage: string;
  let tone: 'celebration' | 'urgency' | 'guidance' | 'reassurance';
  
  if (opportunities.some(opp => opp.type === 'urgent')) {
    tone = 'urgency';
    const urgentOpp = opportunities.find(opp => opp.type === 'urgent');
    primaryMessage = `🚨 ${urgentOpp?.title} - Take action to optimize your portfolio.`;
  } else if (opportunities.some(opp => opp.dollarImpact > 5000)) {
    tone = 'guidance';
    const bigOpp = opportunities.find(opp => opp.dollarImpact > 5000);
    primaryMessage = `💡 ${bigOpp?.title} could add $${(bigOpp?.dollarImpact || 0).toLocaleString()} annually`;
  } else if (allocationAnalysis.filter(cat => cat.status === 'perfect').length >= 3) {
    tone = 'celebration';
    primaryMessage = `🎉 Portfolio excellently balanced! You're ${fiProgress.percentToFirstMillion.toFixed(1)}% to your first million.`;
  } else {
    tone = 'guidance';
    primaryMessage = `📊 Portfolio analysis complete. ${opportunities.length} optimization opportunities identified.`;
  }
  
  // Simple supporting messages (SIMPLIFIED)
  const supportingMessages: string[] = [];
  
  if (fiProgress.percentToFirstMillion > 40) {
    supportingMessages.push(`Strong FI progress: ${fiProgress.percentToFirstMillion.toFixed(1)}% to first million`);
  }
  
  if (employmentPassIntel && employmentPassIntel.advantageValue > 1000) {
    supportingMessages.push(`Employment Pass tax advantages worth $${employmentPassIntel.advantageValue.toLocaleString()}`);
  }
  
  const perfectCategories = allocationAnalysis.filter(cat => cat.status === 'perfect').length;
  if (perfectCategories >= 2) {
    supportingMessages.push(`${perfectCategories}/4 categories well allocated`);
  }
  
  return {
    primaryMessage,
    tone,
    supportingMessages
  };
}

/**
 * Singapore Employment Pass advantage analysis (SIMPLIFIED - use singaporeTax.ts)
 */
function analyzeEmploymentPassAdvantages(user: UserProfile) {
  // Use consolidated tax intelligence from singaporeTax.ts
  const taxIntelligence = generateTaxIntelligence(
    user.estimatedIncome,
    user.currentSRSContributions,
    'Employment Pass'
  );
  
  return {
    srsOpportunity: taxIntelligence.srsOptimization,
    etfTaxEfficiency: {
      recommendation: 'Use Irish-domiciled ETFs to avoid US estate tax'
    },
    advantageValue: taxIntelligence.employmentPassAdvantage.additionalTaxSavings,
    urgencyLevel: taxIntelligence.srsOptimization.urgencyLevel
  };
}

/**
 * Simple fallback intelligence (SIMPLIFIED)
 */
export function getFallbackIntelligence(holdings: Holding[]): PortfolioIntelligenceReport {
  const totalValue = holdings.reduce((sum, h) => sum + h.valueSGD, 0);
  
  return {
    statusIntelligence: {
      fiProgress: `${((totalValue / 1000000) * 100).toFixed(1)}% to first million`,
      urgentAction: "Portfolio analysis in progress",
      deadline: null,
      netWorth: totalValue
    },
    allocationIntelligence: [],
    actionIntelligence: [{
      id: 'fallback',
      type: 'opportunity',
      title: 'Review Portfolio Allocation',
      description: 'Ensure your portfolio matches your target allocation',
      dollarImpact: 0,
      timeline: 'This week',
      actionText: 'Review Allocation',
      priority: 5,
      category: 'general'
    }],
    narrativeIntelligence: {
      primaryMessage: "Portfolio intelligence is loading. Your plan remains solid.",
      tone: 'guidance',
      supportingMessages: ["Stick to your long-term allocation strategy"]
    },
    generated: new Date().toISOString(),
    nextRefresh: new Date(Date.now() + 300000).toISOString() // 5 minutes
  };
}