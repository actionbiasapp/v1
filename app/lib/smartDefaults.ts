// app/lib/smartDefaults.ts (INTELLIGENT AUTO-POPULATION)

import { FINANCIAL_CONSTANTS } from './constants';

interface PortfolioData {
  totalValue: number;
  monthlyContributions?: number;
  savingsRate?: number;
}

interface SmartDefaults {
  income: number;
  expenses: number;
  srsContributions: number;
  fiTarget: number;
  fiYear: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
}

/**
 * Generate intelligent defaults based on existing portfolio data
 * This eliminates manual data entry for sophisticated users
 */
export function generateSmartDefaults(portfolioData: PortfolioData): SmartDefaults {
  const { totalValue } = portfolioData;

  // Smart income estimation based on portfolio size
  // Sophisticated investors typically have 20-40% savings rates
  const estimatedSavingsRate = FINANCIAL_CONSTANTS.DEFAULT_SAVINGS_RATE; // Conservative 30%
  const estimatedIncome = Math.round(totalValue * 0.2 / estimatedSavingsRate); // Assume 5 years of savings
  
  // Smart expense calculation
  const estimatedExpenses = Math.round(estimatedIncome * (1 - estimatedSavingsRate));
  
  // SRS optimization for Employment Pass holders
  const optimalSRS = Math.min(FINANCIAL_CONSTANTS.SRS_LIMIT_EMPLOYMENT_PASS, estimatedIncome * 0.15); // Max 15% of income to SRS
  
  // FI target based on 4% rule + Singapore context
  const singaporeFIMultiplier = FINANCIAL_CONSTANTS.LEAN_FI_MULTIPLIER; // 4% rule = 25x expenses, but Singapore is expensive
  const fiTarget = Math.round(estimatedExpenses * singaporeFIMultiplier);
  
  // FI year based on current trajectory
  const currentSavings = estimatedIncome - estimatedExpenses;
  const yearsToFI = (fiTarget - totalValue) / currentSavings;
  const fiYear = new Date().getFullYear() + Math.round(yearsToFI);
  
  const reasoning = [
    `Income estimated from portfolio size (${totalValue.toLocaleString()}) assuming 30% savings rate`,
    `SRS contribution optimized for Employment Pass holders (${optimalSRS.toLocaleString()})`,
    `FI target based on 25x annual expenses for Singapore cost of living`,
    `Timeline assumes current savings trajectory continues`
  ];
  
  return {
    income: estimatedIncome,
    expenses: estimatedExpenses,
    srsContributions: Math.round(optimalSRS),
    fiTarget,
    fiYear: Math.min(fiYear, 2050), // Cap at reasonable year
    confidence: totalValue > 200000 ? 'high' : totalValue > 50000 ? 'medium' : 'low',
    reasoning
  };
}

/**
 * Auto-populate financial data from actual portfolio holdings
 */
export async function autoPopulateFromPortfolio(): Promise<SmartDefaults | null> {
  try {
    // Get current portfolio data
    const response = await fetch('/api/holdings');
    const holdings = await response.json();
    
    if (!holdings || holdings.length === 0) {
      return null;
    }
    
    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum: number, holding: any) => 
      sum + (holding.valueSGD || 0), 0
    );
    
    // Look for patterns in holdings to improve estimates
    const monthlyInvestments = analyzeInvestmentPatterns(holdings);
    
    return generateSmartDefaults({ 
      totalValue, 
      monthlyContributions: monthlyInvestments 
    });
    
  } catch (error) {
    console.error('Auto-population failed:', error);
    return null;
  }
}

/**
 * Analyze investment patterns from holdings data
 */
function analyzeInvestmentPatterns(holdings: any[]): number {
  // Simple heuristic: estimate monthly contributions based on portfolio size
  // More sophisticated: analyze holding dates and amounts
  const totalValue = holdings.reduce((sum, h) => sum + (h.valueSGD || 0), 0);
  
  // Estimate monthly contribution (portfolio / estimated years of investing)
  const estimatedYearsInvesting = Math.max(1, Math.min(10, holdings.length / 2));
  const monthlyContribution = totalValue / (estimatedYearsInvesting * 12);
  
  return Math.round(monthlyContribution);
}

/**
 * Validate and adjust smart defaults based on user input
 */
export function validateAndAdjustDefaults(
  defaults: SmartDefaults, 
  userInput: Partial<SmartDefaults>
): SmartDefaults {
  const adjusted = { ...defaults, ...userInput };
  
  // Sanity checks and adjustments
  if (adjusted.expenses >= adjusted.income) {
    adjusted.expenses = Math.round(adjusted.income * 0.7); // Max 70% expense ratio
  }
  
  if (adjusted.srsContributions > 35700) {
    adjusted.srsContributions = 35700; // Employment Pass limit
  }
  
  const savingsRate = (adjusted.income - adjusted.expenses) / adjusted.income;
  if (savingsRate < 0.1) { // Minimum 10% savings rate
    adjusted.expenses = Math.round(adjusted.income * 0.9);
  }
  
  return adjusted;
}