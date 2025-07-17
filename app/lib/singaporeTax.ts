// app/lib/singaporeTax.ts - Complete Singapore Tax Engine (MVP Consolidated)
// Single source of truth for ALL Singapore tax logic

interface SRSAnalysis {
  recommendedContribution: number;
  taxSavings: number;
  netCost: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  urgencyDays: number;
  deadline: string;
  monthlyTarget: number;
  progressPercent: number;
  employmentPassAdvantage: number;
}

interface TaxBracketInfo {
  bracket: number;
  rate: number;
  description: string;
  nextBracket?: {
    threshold: number;
    rate: number;
  };
}

interface TaxInsight {
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

// CONSOLIDATED: Tax Intelligence interface (from taxIntelligence.ts)
interface TaxIntelligence {
  srsOptimization: {
    remainingRoom: number;
    taxSavings: number;
    daysToDeadline: number;
    monthlyTarget: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    maxContribution: number;
    currentContributions: number;
    taxBracket: number;
  };
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

// Singapore tax brackets for 2025
const TAX_BRACKETS = [
  { threshold: 0, rate: 0, description: "Tax-free income" },
  { threshold: 20000, rate: 2, description: "Low income bracket" },
  { threshold: 30000, rate: 3.5, description: "Lower middle bracket" },
  { threshold: 40000, rate: 7, description: "Middle income bracket" },
  { threshold: 80000, rate: 11.5, description: "Upper middle bracket" },
  { threshold: 120000, rate: 15, description: "High income bracket" },
  { threshold: 160000, rate: 18, description: "Higher income bracket" },
  { threshold: 200000, rate: 19, description: "Very high income" },
  { threshold: 240000, rate: 19.5, description: "Top tier income" },
  { threshold: 280000, rate: 20, description: "Elite income bracket" },
  { threshold: 320000, rate: 22, description: "Maximum tax bracket" }
];

export function calculateTaxBracket(annualIncome: number): TaxBracketInfo {
  let currentBracket = TAX_BRACKETS[0];
  let nextBracket: TaxBracketInfo['nextBracket'] = TAX_BRACKETS[1];
  
  for (let i = 0; i < TAX_BRACKETS.length - 1; i++) {
    if (annualIncome >= TAX_BRACKETS[i].threshold && 
        annualIncome < TAX_BRACKETS[i + 1].threshold) {
      currentBracket = TAX_BRACKETS[i];
      nextBracket = TAX_BRACKETS[i + 1];
      break;
    }
  }
  
  // Handle top bracket
  if (annualIncome >= TAX_BRACKETS[TAX_BRACKETS.length - 1].threshold) {
    currentBracket = TAX_BRACKETS[TAX_BRACKETS.length - 1];
    nextBracket = undefined;
  }
  
  return {
    bracket: currentBracket.rate,
    rate: currentBracket.rate,
    description: currentBracket.description,
    nextBracket: nextBracket ? {
      threshold: nextBracket.threshold,
      rate: nextBracket.rate
    } : undefined
  };
}

// CONSOLIDATED: Estimate income from portfolio (from taxIntelligence.ts)
export function estimateIncomeFromPortfolio(portfolioValue: number): number {
  if (portfolioValue < 50000) return 100000; // Conservative default
  
  // Assume 40% savings rate for Employment Pass holders over 3 years
  const assumedSavingsRate = 0.4;
  const assumedYearsInvesting = 3;
  
  const estimatedIncome = portfolioValue / (assumedSavingsRate * assumedYearsInvesting);
  
  // Bound to reasonable Singapore Employment Pass ranges
  return Math.max(80000, Math.min(estimatedIncome, 300000));
}

export function calculateSRSOptimization(
  annualIncome: number,
  currentContributions: number = 0,
  taxStatus: 'Employment Pass' | 'Citizen' | 'PR' = 'Employment Pass'
): SRSAnalysis {
  const maxContribution = taxStatus === 'Employment Pass' ? 35700 : 15000;
  const remainingRoom = Math.max(0, maxContribution - currentContributions);
  const taxBracket = calculateTaxBracket(annualIncome);
  const taxSavings = remainingRoom * (taxBracket.rate / 100);
  const netCost = remainingRoom - taxSavings;
  
  // Calculate urgency based on time to deadline
  const deadline = new Date('2025-12-31');
  const today = new Date();
  const urgencyDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  if (urgencyDays < 30) urgencyLevel = 'critical';
  else if (urgencyDays < 90) urgencyLevel = 'high';
  else if (urgencyDays < 180) urgencyLevel = 'medium';
  else urgencyLevel = 'low';
  
  // Calculate monthly target
  const monthlyTarget = remainingRoom / Math.max(1, Math.ceil(urgencyDays / 30));
  
  // Calculate progress
  const progressPercent = (currentContributions / maxContribution) * 100;
  
  // Employment Pass advantage
  const employmentPassAdvantage = taxStatus === 'Employment Pass' 
    ? (35700 - 15000) * (taxBracket.rate / 100) 
    : 0;
  
  return {
    recommendedContribution: remainingRoom,
    taxSavings,
    netCost,
    urgencyLevel,
    urgencyDays,
    deadline: 'December 31, 2025',
    monthlyTarget,
    progressPercent,
    employmentPassAdvantage
  };
}

// CONSOLIDATED: Generate tax intelligence (from taxIntelligence.ts)
export function generateTaxIntelligence(
  income: number = 120000,
  currentSRSContributions: number = 0,
  taxStatus: string = 'Employment Pass'
): TaxIntelligence {
  
  // Core SRS optimization
  const srsOptimization = calculateSRSOptimization(income, currentSRSContributions, taxStatus as any);
  
  // Opportunity cost calculations
  const monthsRemaining = Math.max(Math.ceil(srsOptimization.urgencyDays / 30), 1);
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
  const taxBracket = calculateTaxBracket(income);
  const advantageTaxSavings = advantageAmount * (taxBracket.rate / 100);
  
  const employmentPassAdvantage = {
    srsLimitAdvantage: advantageAmount,
    additionalTaxSavings: advantageTaxSavings,
    vsComparison: `$${advantageTaxSavings.toFixed(0)} more tax savings vs Citizens/PRs`
  };
  
  return {
    srsOptimization: {
      remainingRoom: srsOptimization.recommendedContribution,
      taxSavings: srsOptimization.taxSavings,
      daysToDeadline: srsOptimization.urgencyDays,
      monthlyTarget: srsOptimization.monthlyTarget,
      urgencyLevel: srsOptimization.urgencyLevel,
      maxContribution: taxStatus === 'Employment Pass' ? 35700 : 15000,
      currentContributions: currentSRSContributions,
      taxBracket: taxBracket.rate
    },
    opportunityCost,
    employmentPassAdvantage
  };
}

// CONSOLIDATED: Convert tax intelligence to actions (from taxIntelligence.ts)
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
  
  return actions;
}

export function generateSRSInsights(
  portfolioValue: number,
  estimatedIncome?: number
): TaxInsight[] {
  const insights: TaxInsight[] = [];
  
  // Use provided income or estimate from portfolio
  const income = estimatedIncome || estimateIncomeFromPortfolio(portfolioValue);
  const srsAnalysis = calculateSRSOptimization(income, 0, 'Employment Pass');
  
  // Only generate SRS insight if significant tax savings
  if (srsAnalysis.taxSavings > 1000) {
    insights.push({
      id: 'srs-optimization',
      type: srsAnalysis.urgencyLevel === 'critical' ? 'urgent' : 'opportunity',
      category: 'tax',
      title: 'SRS Tax Optimization',
      problem: `Missing ${srsAnalysis.taxSavings.toLocaleString()} in potential tax savings`,
      solution: `Maximize SRS contribution: ${srsAnalysis.recommendedContribution.toLocaleString()} by Dec 31`,
      benefit: `Save ${srsAnalysis.taxSavings.toLocaleString()} in taxes this year`,
      dollarImpact: srsAnalysis.taxSavings,
      timeline: `${srsAnalysis.urgencyDays} days remaining`,
      actionText: 'Optimize SRS',
      priority: srsAnalysis.urgencyLevel === 'critical' ? 10 : 
                srsAnalysis.urgencyLevel === 'high' ? 9 : 8,
      isClickable: true,
      metadata: {
        monthlyTarget: srsAnalysis.monthlyTarget,
        progressPercent: srsAnalysis.progressPercent,
        employmentPassAdvantage: srsAnalysis.employmentPassAdvantage,
        urgencyLevel: srsAnalysis.urgencyLevel,
        maxContribution: 35700,
        currentContributions: 0,
        netCost: srsAnalysis.netCost
      }
    });
  }
  
  // Employment Pass advantage insight
  if (srsAnalysis.employmentPassAdvantage > 2000) {
    insights.push({
      id: 'employment-pass-advantage',
      type: 'opportunity',
      category: 'tax',
      title: 'Employment Pass Tax Advantage',
      problem: `Using only citizen/PR SRS limits (15k vs 35.7k)`,
      solution: `Maximize Employment Pass SRS advantage`,
      benefit: `${srsAnalysis.employmentPassAdvantage.toLocaleString()} additional tax savings vs citizens`,
      dollarImpact: srsAnalysis.employmentPassAdvantage,
      timeline: 'This tax year',
      actionText: 'Learn More',
      priority: 8,
      isClickable: true,
      metadata: {
        citizenLimit: 15000,
        employmentPassLimit: 35700,
        advantage: srsAnalysis.employmentPassAdvantage
      }
    });
  }
  
  return insights;
}

export function detectUSTaxExposure(holdings: any[]): TaxInsight[] {
  const insights: TaxInsight[] = [];
  
  // Common US ETFs that have estate tax risk
  const usETFs = [
    'VOO', 'VTI', 'QQQ', 'SPY', 'IVV', 'VXUS', 'VEA', 'VWO',
    'VTV', 'VUG', 'VBR', 'VBK', 'VO', 'VOE', 'VB', 'ARKK', 'ARKQ'
  ];
  
  const usExposures = holdings.filter(holding => 
    usETFs.includes(holding.symbol.toUpperCase())
  );
  
  if (usExposures.length > 0) {
    const totalUSExposure = usExposures.reduce((sum, holding) => sum + holding.valueSGD, 0);
    const potentialEstateTax = totalUSExposure * 0.4; // 40% estate tax
    
    insights.push({
      id: 'us-estate-tax-risk',
      type: 'optimization',
      category: 'tax',
      title: 'US Estate Tax Risk',
      problem: `${(totalUSExposure/1000).toFixed(0)}k in US ETFs subject to 40% estate tax`,
      solution: `Switch to Irish-domiciled equivalents (e.g., VUAA.L for VOO)`,
      benefit: `Avoid potential ${(potentialEstateTax/1000).toFixed(0)}k estate tax liability`,
      dollarImpact: potentialEstateTax,
      timeline: 'Next rebalancing',
      actionText: 'Review ETFs',
      priority: 6,
      isClickable: true,
      metadata: {
        usHoldings: usExposures.map(h => h.symbol),
        totalExposure: totalUSExposure,
        potentialEstateTax: potentialEstateTax
      }
    });
  }
  
  return insights;
}

export function generateTaxOptimizationInsights(
  holdings: any[],
  portfolioValue: number,
  estimatedIncome?: number
): TaxInsight[] {
  const allInsights: TaxInsight[] = [];
  
  // Generate SRS optimization insights
  allInsights.push(...generateSRSInsights(portfolioValue, estimatedIncome));
  
  // Generate US estate tax exposure insights
  allInsights.push(...detectUSTaxExposure(holdings));
  
  // Sort by priority and return
  return allInsights.sort((a, b) => b.priority - a.priority);
}

export function getIrishAlternative(usSymbol: string): string {
  const alternatives: Record<string, string> = {
    'VOO': 'VUAA.L',
    'VTI': 'VHVG.L',
    'QQQ': 'EQQQ.L',
    'SPY': 'VUAA.L',
    'IVV': 'VUAA.L',
    'VXUS': 'VHVG.L',
    'VEA': 'VHVE.L',
    'VWO': 'VHVE.L'
  };
  
  return alternatives[usSymbol.toUpperCase()] || 'Irish-domiciled equivalent';
}

export function calculateEmploymentPassAdvantage(): {
  srsAdvantage: {
    employmentPass: number;
    citizenPR: number;
    additionalRoom: number;
    maxAdditionalSavings: number;
  };
  cpfAdvantage: {
    employmentPass: string;
    citizenPR: string;
    benefit: string;
  };
  estateAdvantage: {
    recommendation: string;
    riskForUS: string;
  };
} {
  return {
    srsAdvantage: {
      employmentPass: 35700,
      citizenPR: 15000,
      additionalRoom: 20700,
      maxAdditionalSavings: 20700 * 0.22 // At top tax bracket
    },
    cpfAdvantage: {
      employmentPass: "No mandatory CPF contributions",
      citizenPR: "37% mandatory CPF (20% employee + 17% employer)",
      benefit: "More take-home income available for investment"
    },
    estateAdvantage: {
      recommendation: "Use Irish-domiciled ETFs to avoid US estate tax",
      riskForUS: "40% estate tax on US assets for non-residents"
    }
  };
}

// Utility functions for tax calculations
export function calculateMarginalTaxRate(income: number): number {
  return calculateTaxBracket(income).rate;
}

export function calculateEffectiveTaxRate(income: number): number {
  let totalTax = 0;
  let remainingIncome = income;
  
  for (let i = 0; i < TAX_BRACKETS.length - 1; i++) {
    const bracket = TAX_BRACKETS[i];
    const nextBracket = TAX_BRACKETS[i + 1];
    
    if (remainingIncome <= 0) break;
    
    const taxableInBracket = Math.min(
      remainingIncome,
      nextBracket.threshold - bracket.threshold
    );
    
    totalTax += taxableInBracket * (bracket.rate / 100);
    remainingIncome -= taxableInBracket;
  }
  
  // Handle top bracket
  if (remainingIncome > 0) {
    const topBracket = TAX_BRACKETS[TAX_BRACKETS.length - 1];
    totalTax += remainingIncome * (topBracket.rate / 100);
  }
  
  return income > 0 ? (totalTax / income) * 100 : 0;
}

export function formatTaxAmount(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function getDeadlineUrgency(targetDate: string): {
  days: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  urgencyText: string;
} {
  const deadline = new Date(targetDate);
  const today = new Date();
  const days = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  let urgencyText: string;
  
  if (days < 30) {
    urgencyLevel = 'critical';
    urgencyText = 'Critical - Act now!';
  } else if (days < 90) {
    urgencyLevel = 'high';
    urgencyText = 'High priority';
  } else if (days < 180) {
    urgencyLevel = 'medium';
    urgencyText = 'Medium priority';
  } else {
    urgencyLevel = 'low';
    urgencyText = 'Plan ahead';
  }
  
  return { days, urgencyLevel, urgencyText };
}