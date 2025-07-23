// app/lib/constants.ts
// Centralized constants for the entire application

// PORTFOLIO ALLOCATION TARGETS
export const DEFAULT_ALLOCATION_TARGETS = {
  core: 25,
  growth: 55,
  hedge: 10,
  liquidity: 10,
  rebalanceThreshold: 5
} as const;

// FINANCIAL CONSTANTS
export const FINANCIAL_CONSTANTS = {
  // SRS Limits
  SRS_LIMIT_EMPLOYMENT_PASS: 35700,
  SRS_LIMIT_CITIZEN_PR: 15000,
  
  // FI Targets
  DEFAULT_FI_GOAL: 2500000,
  DEFAULT_FI_YEAR: 2032,
  LEAN_FI_MULTIPLIER: 25, // 4% rule = 25x expenses
  
  // Savings & Income
  DEFAULT_SAVINGS_RATE: 0.30, // 30%
  MIN_SAVINGS_RATE: 0.10, // 10%
  MAX_EXPENSE_RATIO: 0.70, // 70%
  
  // Tax Brackets (Singapore)
  TAX_BRACKETS: [
    { threshold: 0, rate: 0 },
    { threshold: 20000, rate: 2 },
    { threshold: 30000, rate: 3.5 },
    { threshold: 40000, rate: 7 },
    { threshold: 80000, rate: 11.5 },
    { threshold: 120000, rate: 15 },
    { threshold: 160000, rate: 18 },
    { threshold: 200000, rate: 19 },
    { threshold: 240000, rate: 19.5 },
    { threshold: 280000, rate: 20 },
    { threshold: 320000, rate: 22 },
    { threshold: 500000, rate: 23 },
    { threshold: 1000000, rate: 24 }
  ]
} as const;

// EXCHANGE RATES (Fallback values)
export const FALLBACK_EXCHANGE_RATES = {
  SGD_TO_USD: 0.74,
  SGD_TO_INR: 63.50,
  USD_TO_SGD: 1.35,
  USD_TO_INR: 85.50,
  INR_TO_SGD: 0.0157,
  INR_TO_USD: 0.0117
} as const;

// CURRENCY CONVERSION RATES (Hardcoded fallbacks)
export const CURRENCY_RATES = {
  INR_TO_SGD: 0.0148337,
  SGD_TO_INR: 67.4
} as const;

// API ENDPOINTS
export const API_ENDPOINTS = {
  HOLDINGS: '/api/holdings',
  INSIGHTS: '/api/insights',
  INTELLIGENCE: '/api/intelligence',
  EXCHANGE_RATES: '/api/exchange-rates',
  FINANCIAL_PROFILE: '/api/financial-profile',
  YEARLY_DATA: '/api/yearly-data',
  PRICES_UPDATE: '/api/prices/update'
} as const;

// UI CONSTANTS
export const UI_CONSTANTS = {
  // Component limits
  MAX_COMPONENT_LINES: 500,
  MAX_FILE_SIZE_KB: 50,
  
  // Display limits
  MAX_DISPLAY_HOLDINGS: 10,
  MAX_ACTION_ITEMS: 5,
  
  // Animation durations
  TRANSITION_DURATION: 300,
  LOADING_DELAY: 100
} as const;

// ERROR MESSAGES
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred',
  API_ERROR: 'API request failed',
  VALIDATION_ERROR: 'Invalid data provided',
  CURRENCY_CONVERSION_ERROR: 'Currency conversion failed',
  PORTFOLIO_CALCULATION_ERROR: 'Portfolio calculation failed'
} as const;

// SUCCESS MESSAGES
export const SUCCESS_MESSAGES = {
  HOLDING_CREATED: 'Holding created successfully',
  HOLDING_UPDATED: 'Holding updated successfully',
  HOLDING_DELETED: 'Holding deleted successfully',
  PRICES_UPDATED: 'Prices updated successfully',
  PROFILE_SAVED: 'Profile saved successfully'
} as const;

// CATEGORY DEFINITIONS
export const PORTFOLIO_CATEGORIES = {
  CORE: {
    name: 'Core',
    color: 'bg-blue-500',
    icon: '🛡️',
    description: 'Stable dividend stocks, bonds, REITs'
  },
  GROWTH: {
    name: 'Growth',
    color: 'bg-green-500',
    icon: '📈',
    description: 'Growth stocks, tech, emerging markets'
  },
  HEDGE: {
    name: 'Hedge',
    color: 'bg-yellow-500',
    icon: '⚖️',
    description: 'Gold, commodities, hedge funds'
  },
  LIQUIDITY: {
    name: 'Liquidity',
    color: 'bg-purple-500',
    icon: '💰',
    description: 'Cash, money market, short-term bonds'
  }
} as const;

// TIME CONSTANTS
export const TIME_CONSTANTS = {
  // Cache durations
  EXCHANGE_RATES_CACHE_HOURS: 1,
  INTELLIGENCE_CACHE_HOURS: 1,
  INSIGHTS_CACHE_MINUTES: 5,
  
  // API rate limits
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10,
  
  // SRS deadline
  SRS_DEADLINE_MONTH: 12,
  SRS_DEADLINE_DAY: 31
} as const; 