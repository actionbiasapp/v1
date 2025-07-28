// /lib/currency.ts
// Currency conversion utilities and rate management

export type CurrencyCode = 'SGD' | 'INR' | 'USD';

export interface ExchangeRates {
  SGD_TO_USD: number;
  SGD_TO_INR: number;
  USD_TO_SGD: number;
  USD_TO_INR: number;
  INR_TO_SGD: number;
  INR_TO_USD: number;
}

export interface CurrencyValues {
  valueSGD: number;
  valueINR: number;
  valueUSD: number;
  entryCurrency: CurrencyCode;
}

export interface ExchangeRateData {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  source: 'api' | 'manual';
  updatedAt: Date;
}

// Currency metadata
export const CURRENCY_INFO = {
  SGD: { symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' }
} as const;

// Default exchange rates (fallback)
const DEFAULT_RATES: ExchangeRates = {
  SGD_TO_USD: 0.74,
  SGD_TO_INR: 63.50,
  USD_TO_SGD: 1.35,
  USD_TO_INR: 85.50,
  INR_TO_SGD: 0.0157,
  INR_TO_USD: 0.0117
};

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: ExchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const rateKey = `${fromCurrency}_TO_${toCurrency}` as keyof ExchangeRates;
  const rate = rates[rateKey];
  
  if (!rate) {
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
  }
  
  return Number((amount * rate).toFixed(2));
}

/**
 * Convert a single currency value to all three currencies
 */
export function convertToAllCurrencies(
  amount: number,
  entryCurrency: CurrencyCode,
  rates: ExchangeRates
): CurrencyValues {
  return {
    valueSGD: convertCurrency(amount, entryCurrency, 'SGD', rates),
    valueINR: convertCurrency(amount, entryCurrency, 'INR', rates),
    valueUSD: convertCurrency(amount, entryCurrency, 'USD', rates),
    entryCurrency
  };
}

/**
 * Format number with thousand separators
 */
export function formatNumberWithSeparators(
  value: number | string,
  options: { precision?: number; compact?: boolean } = {}
): string {
  const { precision = 0, compact = false } = options;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (compact && Math.abs(num) >= 1000) {
    if (Math.abs(num) >= 1000000) {
      return `${(num / 1000000).toFixed(precision)}M`;
    } else {
      return `${(num / 1000).toFixed(precision)}k`;
    }
  }
  
  return new Intl.NumberFormat('en-SG', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: true
  }).format(num);
}

/**
 * Format currency value with proper symbol and formatting
 */
export function formatCurrency(
  amount: number, 
  currency: CurrencyCode,
  options: { compact?: boolean; precision?: number } = {}
): string {
  const { compact = false, precision = 0 } = options;
  const { symbol } = CURRENCY_INFO[currency];
  
  if (compact && Math.abs(amount) >= 1000) {
    if (Math.abs(amount) >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(precision)}M`;
    } else {
      return `${symbol}${(amount / 1000).toFixed(precision)}k`;
    }
  }
  
  // Use Intl.NumberFormat for consistent thousand separators
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: true // Ensure thousand separators
  }).format(amount).replace(/[A-Z]{3}/, symbol);
}

/**
 * Format currency display for holdings
 * Shows both portfolio currency and holding currency when they differ
 * Avoids duplication when portfolio currency matches holding currency
 */
export function formatCurrencyDisplay(
  holding: { 
    valueSGD: number; 
    valueINR: number; 
    valueUSD: number; 
    entryCurrency: string;
    quantity?: number;
    currentUnitPrice?: number;
  },
  portfolioCurrency: CurrencyCode,
  exchangeRates?: any
): string {
  const holdingCurrency = holding.entryCurrency as CurrencyCode;
  
  // Get the value in portfolio currency
  const portfolioValue = getHoldingDisplayValue(holding, portfolioCurrency);
  
  // If currencies are the same, show only one
  if (portfolioCurrency === holdingCurrency) {
    return formatCurrency(portfolioValue, portfolioCurrency, { compact: true, precision: 0 });
  }
  
  // Get the value in holding's native currency
  let holdingValue: number;
  
  if (holding.quantity && holding.currentUnitPrice) {
    // Use calculated value from quantity × current price
    holdingValue = holding.quantity * holding.currentUnitPrice;
  } else {
    // Use stored value
    holdingValue = getHoldingDisplayValue(holding, holdingCurrency);
  }
  
  // Format both currencies
  const portfolioFormatted = formatCurrency(portfolioValue, portfolioCurrency, { compact: true, precision: 0 });
  const holdingFormatted = formatCurrency(holdingValue, holdingCurrency, { compact: true, precision: 0 });
  
  return `${portfolioFormatted} (${holdingFormatted})`;
}

/**
 * Fetch exchange rates from external API
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRates> {
  try {
    // Using exchangerate-api.io (free tier: 1500 requests/month)
    const sgdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/SGD');
    const sgdData = await sgdResponse.json();
    
    const usdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const usdData = await usdResponse.json();
    
    const inrResponse = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
    const inrData = await inrResponse.json();
    
    return {
      SGD_TO_USD: sgdData.rates.USD,
      SGD_TO_INR: sgdData.rates.INR,
      USD_TO_SGD: usdData.rates.SGD,
      USD_TO_INR: usdData.rates.INR,
      INR_TO_SGD: inrData.rates.SGD,
      INR_TO_USD: inrData.rates.USD
    };
  } catch (error) {
    console.error('Failed to fetch live exchange rates:', error);
    throw error;
  }
}

/**
 * Get cached exchange rates from database or use defaults
 */
export async function getCachedExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch('/api/exchange-rates');
    if (!response.ok) throw new Error('Failed to fetch cached rates');
    
    const rates = await response.json();
    return rates;
  } catch (error) {
    console.warn('Using default exchange rates due to error:', error);
    return DEFAULT_RATES;
  }
}

/**
 * Check if exchange rates need updating (older than 1 hour)
 */
export function needsRateUpdate(lastUpdated: Date): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return lastUpdated < oneHourAgo;
}

/**
 * Validate currency amount input
 */
export function validateCurrencyAmount(amount: string | number): {
  isValid: boolean;
  error?: string;
  value?: number;
} {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Invalid number format' };
  }
  
  if (numAmount < 0) {
    return { isValid: false, error: 'Amount must be positive' };
  }
  
  if (numAmount > 1000000000) {
    return { isValid: false, error: 'Amount too large' };
  }
  
  return { isValid: true, value: numAmount };
}

/**
 * Get the display value for a holding in the specified currency
 */
export function getHoldingDisplayValue(
  holding: { valueSGD: number; valueINR: number; valueUSD: number },
  displayCurrency: CurrencyCode
): number {
  switch (displayCurrency) {
    case 'SGD': return holding.valueSGD;
    case 'INR': return holding.valueINR;
    case 'USD': return holding.valueUSD;
    default: return holding.valueSGD;
  }
}