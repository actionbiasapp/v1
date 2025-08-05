// Centralized configuration for all hardcoded values
// This file serves as the single source of truth for all constants

export const APP_CONFIG = {
  // Financial Constants
  FINANCIAL: {
    // SRS Limits
    SRS_LIMIT_EMPLOYMENT_PASS: 35700,
    SRS_LIMIT_CITIZEN: 15000,
    SRS_LIMIT_PR: 15000,
    
    // FI Targets (SGD)
    FI_TARGETS: {
      FIRST_MILLION: 1000000,
      LEAN_FI: 1850000,
      FULL_FI: 2500000,
      FAT_FI: 5000000
    },
    
    // Default FI Goals
    DEFAULT_FI_GOAL: 2500000,
    DEFAULT_FI_YEAR: 2032,
    
    // Default Savings (used when no yearly data available)
    DEFAULT_TOTAL_SAVINGS: 350000,
    
    // Tax Brackets
    TAX_BRACKETS: {
      1000000: 24,
      500000: 22,
      320000: 18,
      200000: 11.5,
      0: 0
    }
  },
  
  // Exchange Rates (fallback values)
  EXCHANGE_RATES: {
    SGD_TO_USD: 1.35,
    SGD_TO_INR: 63.0,
    USD_TO_SGD: 1 / 1.35,
    USD_TO_INR: 1.35 * 63.0,
    INR_TO_SGD: 1 / 63.0,
    INR_TO_USD: 1 / (1.35 * 63.0)
  },
  
  // Default User Profile
  USER_PROFILE: {
    DEFAULT_TAX_STATUS: 'Employment Pass' as const,
    DEFAULT_COUNTRY: 'Singapore',
    DEFAULT_CURRENCY: 'SGD' as const,
    DEFAULT_SRS_LIMIT: 35700,
    DEFAULT_FI_GOAL: 2500000,
    DEFAULT_FI_YEAR: 2032
  },
  
  // Portfolio Allocation Defaults
  ALLOCATION: {
    CORE_TARGET: 25,
    GROWTH_TARGET: 55,
    HEDGE_TARGET: 10,
    LIQUIDITY_TARGET: 10,
    REBALANCE_THRESHOLD: 5
  },
  
  // Validation Limits
  VALIDATION: {
    MAX_QUANTITY: 1000000,
    MAX_VALUE: 1000000000,
    MIN_VALUE: 0
  }
} as const;

// Helper functions to get values with proper typing
export function getSRSLimit(taxStatus: string): number {
  switch (taxStatus) {
    case 'Employment Pass':
      return APP_CONFIG.FINANCIAL.SRS_LIMIT_EMPLOYMENT_PASS;
    case 'Citizen':
    case 'PR':
      return APP_CONFIG.FINANCIAL.SRS_LIMIT_CITIZEN;
    default:
      return APP_CONFIG.FINANCIAL.SRS_LIMIT_EMPLOYMENT_PASS;
  }
}

export function getFITarget(target: keyof typeof APP_CONFIG.FINANCIAL.FI_TARGETS): number {
  return APP_CONFIG.FINANCIAL.FI_TARGETS[target];
}

export function getTaxBracket(income: number): number {
  const brackets = APP_CONFIG.FINANCIAL.TAX_BRACKETS;
  for (const [threshold, rate] of Object.entries(brackets).sort((a, b) => Number(b[0]) - Number(a[0]))) {
    if (income >= Number(threshold)) {
      return rate;
    }
  }
  return 0;
} 