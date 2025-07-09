// app/lib/singaporeTax.ts - Singapore Employment Pass Tax Optimization

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

export function estimateIncomeFromPortfolio(portfolioValue: number): number {
  // Conservative estimate: assume 20-30% savings rate
  // Higher portfolio suggests higher income
  if (portfolioValue < 50000) return 80000;
  if (portfolioValue < 100000) return 100000;
  if (portfolioValue < 200000) return 120000;
  if (portfolioValue < 400000) return 150000;
  if (portfolioValue < 600000) return 180000;
  if (portfolioValue < 1000000) return 220000;
  return 250000;
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

export function calculateTaxEfficiency(
  holdings: any[],
  portfolioValue: number
): {
  currentEfficiency: number;
  optimizedEfficiency: number;
  improvementPotential: number;
  recommendations: string[];
} {
  const srsAnalysis = calculateSRSOptimization(
    estimateIncomeFromPortfolio(portfolioValue),
    0,
    'Employment Pass'
  );
  
  const usExposures = detectUSTaxExposure(holdings);
  const usEstateTaxRisk = usExposures.reduce((sum, insight) => 
    sum + (insight.metadata?.potentialEstateTax || 0), 0
  );
  
  // Simple tax efficiency score (0-100)
  const currentEfficiency = Math.max(0, 100 - 
    (srsAnalysis.taxSavings / portfolioValue * 100) - 
    (usEstateTaxRisk / portfolioValue * 100)
  );
  
  const optimizedEfficiency = Math.min(100, currentEfficiency + 
    (srsAnalysis.taxSavings / portfolioValue * 100) + 
    (usEstateTaxRisk / portfolioValue * 100)
  );
  
  const improvementPotential = optimizedEfficiency - currentEfficiency;
  
  const recommendations = [
    ...(srsAnalysis.taxSavings > 1000 ? ['Maximize SRS contributions'] : []),
    ...(usEstateTaxRisk > 10000 ? ['Switch to Irish-domiciled ETFs'] : []),
    'Consider tax-loss harvesting opportunities',
    'Review holding periods for capital gains optimization'
  ];
  
  return {
    currentEfficiency,
    optimizedEfficiency,
    improvementPotential,
    recommendations
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