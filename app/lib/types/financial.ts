// app/lib/types/financial.ts
// Enhanced types for V5.4 with NetWorthTracker-style management

export interface YearlyIncomeExpense {
  year: number;
  income: number;
  expenses: number;
  savingsRate: number; // auto-calculated
  savingsAmount: number; // auto-calculated
}

export interface FinancialProfile {
  // Basic identification
  userId?: string;
  name?: string;
  email?: string;
  
  // Current year core data (required)
  incomeCurrency: 'SGD' | 'USD' | 'INR';
  annualIncome?: number;
  bonusIncome?: number;
  annualExpenses?: number;
  
  // Multi-year data (NetWorthTracker style)
  yearlyFinancials: YearlyIncomeExpense[];
  
  // FI Journey settings
  fiGoal: number;
  fiTargetYear: number;
  customFIAmount?: number;
  customTargetYear?: number;
  leanFIAmount?: number;
  firstMillionTarget?: boolean;
  leanFITarget?: boolean;
  
  // Tax & SRS
  taxStatus: 'Employment Pass' | 'Citizen' | 'PR';
  currentSRSContributions?: number;
  srsAutoOptimize?: boolean;
  
  // Portfolio strategy (for future Tab 6)
  customAllocationTargets?: {
    core: number;
    growth: number;
    hedge: number;
    liquidity: number;
  };
  
  // Profile metadata
  profileCompleteness: number;
  nextRequiredField?: string;
  lastUpdated?: Date;
}

// API request/response types
export interface SaveFinancialProfileRequest {
  profile: FinancialProfile;
}

export interface SaveFinancialProfileResponse {
  success: boolean;
  profile?: FinancialProfile;
  error?: string;
}

export interface LoadFinancialProfileResponse {
  success: boolean;
  profile?: FinancialProfile;
  error?: string;
}

// Utility functions
export function createDefaultFinancialProfile(): FinancialProfile {
  return {
    incomeCurrency: 'SGD',
    fiGoal: 2500000,
    fiTargetYear: 2032,
    taxStatus: 'Employment Pass',
    firstMillionTarget: true,
    leanFITarget: true,
    srsAutoOptimize: true,
    profileCompleteness: 0,
    yearlyFinancials: [],
  };
}

export function calculateSavingsRate(income: number, expenses: number): number {
  if (!income || income <= 0) return 0;
  return ((income - expenses) / income) * 100;
}

export function calculateProfileCompleteness(profile: FinancialProfile): { percentage: number; nextRequired: string } {
  const requirements = [
    { field: 'annualIncome', label: 'Annual Income', required: true },
    { field: 'annualExpenses', label: 'Annual Expenses', required: true },
    { field: 'customFIAmount', label: 'FI Target Amount', required: true },
    { field: 'currentSRSContributions', label: 'SRS Contributions', required: true },
    { field: 'name', label: 'Full Name', required: false },
    { field: 'leanFIAmount', label: 'Lean FI Amount', required: false },
  ];
  
  let completed = 0;
  let nextRequired = '';
  
  for (const req of requirements) {
    const hasValue = profile[req.field as keyof FinancialProfile] !== undefined && 
                    profile[req.field as keyof FinancialProfile] !== null &&
                    profile[req.field as keyof FinancialProfile] !== '';
    
    if (hasValue) {
      completed++;
    } else if (req.required && !nextRequired) {
      nextRequired = req.label;
    }
  }
  
  const percentage = Math.round((completed / requirements.length) * 100);
  
  return {
    percentage,
    nextRequired: nextRequired || (percentage < 100 ? 'Complete optional fields' : '')
  };
}