// app/lib/taxIntelligence.ts
// Self-contained tax intelligence with no external dependencies

interface SRSOptimization {
  remainingRoom: number;
  taxSavings: number;
  daysToDeadline: number;
  monthlyTarget: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  maxContribution: number;
  currentContributions: number;
  taxBracket: number;
}

interface TaxIntelligence {
  srsOptimization: SRSOptimization;
  opportunityCost: {
    monthlyPotentialSavings: number;
    actionMessage: string;
    urgencyMessage: string;
  };
  employmentPassAdvantage: {
    srsLimitAdvantage: number;
    additionalTaxSavings: number;
    vsComparison: string;
  };
}

// Singapore tax bracket calculation (self-contained)
function calculateTaxBracket(annualIncome: number): number {
  if (annualIncome <= 20000) return 0;
  if (annualIncome <= 30000) return 2;
  if (annualIncome <= 40000) return 3.5;
  if (annualIncome <= 80000) return 7;
  if (annualIncome <= 120000) return 11.5;
  if (annualIncome <= 160000) return 15;
  if (annualIncome <= 200000) return 18;
  if (annualIncome <= 240000) return 19;
  if (annualIncome <= 280000) return 19.5;
  if (annualIncome <= 320000) return 20;
  return 22; // Top bracket
}

// SRS optimization calculation (self-contained)
function calculateSRSOptimization(
  income: number,
  currentContributions: number,
  taxStatus: string
): SRSOptimization {
  const maxContribution = taxStatus === 'Employment Pass' ? 35700 : 15000;
  const remainingRoom = Math.max(0, maxContribution - currentContributions);
  const taxBracket = calculateTaxBracket(income);
  const taxSavings = remainingRoom * (taxBracket / 100);
  
  // Calculate days to SRS deadline (December 31, 2025)
  const today = new Date();
  const deadline = new Date('2025-12-31');
  const daysToDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate monthly target
  const monthsRemaining = Math.max(Math.ceil(daysToDeadline / 30), 1);
  const monthlyTarget = remainingRoom / monthsRemaining;
  
  // Determine urgency level
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  if (remainingRoom === 0) urgencyLevel = 'low';
  else if (daysToDeadline < 60) urgencyLevel = 'critical';
  else if (daysToDeadline < 120) urgencyLevel = 'high';
  else if (daysToDeadline < 240) urgencyLevel = 'medium';
  else urgencyLevel = 'low';
  
  return {
    remainingRoom,
    taxSavings,
    daysToDeadline,
    monthlyTarget,
    urgencyLevel,
    maxContribution,
    currentContributions,
    taxBracket
  };
}

export function generateTaxIntelligence(
  income: number = 120000,
  currentSRSContributions: number = 0,
  taxStatus: string = 'Employment Pass'
): TaxIntelligence {
  
  // Core SRS optimization
  const srsOptimization = calculateSRSOptimization(income, currentSRSContributions, taxStatus);
  
  // Opportunity cost calculations
  const monthsRemaining = Math.max(Math.ceil(srsOptimization.daysToDeadline / 30), 1);
  const monthlyPotentialSavings = srsOptimization.taxSavings / monthsRemaining;
  
  const opportunityCost = {
    monthlyPotentialSavings,
    actionMessage: `Start $${srsOptimization.monthlyTarget.toFixed(0)}/month SRS to capture $${srsOptimization.taxSavings.toLocaleString()} total benefit`,
    urgencyMessage: `Missing $${monthlyPotentialSavings.toFixed(0)} potential tax savings each month waiting`
  };
  
  // Employment Pass advantage calculation
  const citizenLimit = 15000;
  const epLimit = 35700;
  const advantageAmount = epLimit - citizenLimit;
  const advantageTaxSavings = advantageAmount * (srsOptimization.taxBracket / 100);
  
  const employmentPassAdvantage = {
    srsLimitAdvantage: advantageAmount,
    additionalTaxSavings: advantageTaxSavings,
    vsComparison: `$${advantageTaxSavings.toFixed(0)} more tax savings vs Citizens/PRs`
  };
  
  return {
    srsOptimization,
    opportunityCost,
    employmentPassAdvantage
  };
}

// Convert tax intelligence to action items for existing action cards
export function convertTaxIntelligenceToActions(taxIntel: TaxIntelligence): Array<any> {
  const actions = [];
  
  // SRS optimization action
  if (taxIntel.srsOptimization.remainingRoom > 0) {
    actions.push({
      id: 'srs-optimization',
      type: taxIntel.srsOptimization.urgencyLevel === 'critical' ? 'urgent' : 'opportunity',
      title: `SRS Tax Optimization - $${taxIntel.srsOptimization.taxSavings.toLocaleString()} Savings`,
      description: taxIntel.opportunityCost.actionMessage,
      dollarImpact: taxIntel.srsOptimization.taxSavings,
      timeline: `${taxIntel.srsOptimization.daysToDeadline} days remaining`,
      actionText: 'Setup SRS Contributions',
      isClickable: true,
      priority: taxIntel.srsOptimization.urgencyLevel === 'critical' ? 10 : 8
    });
  }
  
  // Employment Pass advantage awareness
  if (taxIntel.employmentPassAdvantage.additionalTaxSavings > 1000) {
    actions.push({
      id: 'employment-pass-advantage',
      type: 'optimization',
      title: 'Employment Pass Tax Advantage',
      description: taxIntel.employmentPassAdvantage.vsComparison,
      dollarImpact: taxIntel.employmentPassAdvantage.additionalTaxSavings,
      timeline: 'Maximize before visa change',
      actionText: 'Learn More',
      isClickable: true,
      priority: 6
    });
  }
  
  console.log('🎯 Generated tax actions:', actions);
  return actions;
}

// Estimate income from portfolio size (fallback when user income unknown)
export function estimateIncomeFromPortfolio(portfolioValue: number): number {
  if (portfolioValue < 50000) return 100000; // Conservative default
  
  // Assume 40% savings rate for Employment Pass holders over 3 years
  const assumedSavingsRate = 0.4;
  const assumedYearsInvesting = 3;
  
  const estimatedIncome = portfolioValue / (assumedSavingsRate * assumedYearsInvesting);
  
  // Bound to reasonable Singapore Employment Pass ranges
  return Math.max(80000, Math.min(estimatedIncome, 300000));
}