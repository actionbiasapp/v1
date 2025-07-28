// app/lib/portfolioCalculations.ts
// Centralized portfolio calculation utilities - Single source of truth

import { type CurrencyCode } from '@/app/lib/currency';
import { convertCurrency } from '@/app/lib/currency';
import { type Holding } from '@/app/lib/types/shared';

export interface ExchangeRates {
  SGD_TO_USD: number;
  SGD_TO_INR: number;
  USD_TO_SGD: number;
  USD_TO_INR: number;
  INR_TO_SGD: number;
  INR_TO_USD: number;
}

export interface PortfolioCalculationResult {
  totalValue: number;
  holdingValues: Array<Holding & { calculatedValue: number }>;
}

/**
 * Calculate portfolio value in specified currency
 * This is the single source of truth for all portfolio calculations
 */
export function calculatePortfolioValue(
  holdings: Holding[],
  displayCurrency: CurrencyCode,
  exchangeRates: ExchangeRates | null
): PortfolioCalculationResult {
  // Calculate total portfolio value
  const totalValue = holdings.reduce((sum, holding) => {
    const currencyValue = calculateHoldingValue(holding, displayCurrency, exchangeRates);
    return sum + currencyValue;
  }, 0);

  // Calculate individual holding values
  const holdingValues = holdings.map(holding => ({
    ...holding,
    calculatedValue: calculateHoldingValue(holding, displayCurrency, exchangeRates)
  }));

  return {
    totalValue,
    holdingValues
  };
}

/**
 * Calculate individual holding value in specified currency
 */
export function calculateHoldingValue(
  holding: Holding,
  displayCurrency: CurrencyCode,
  exchangeRates: ExchangeRates | null
): number {
  let currencyValue = 0;
  
  // Always calculate dynamically using currentPrice × quantity when available
  if (holding.quantity && holding.currentUnitPrice) {
    const quantity = holding.quantity;
    const currentPrice = holding.currentUnitPrice;
    const entryCurrency = holding.entryCurrency as CurrencyCode;
    
    // Calculate the total value in the entry currency
    const totalValueInEntryCurrency = quantity * currentPrice;
    
    // Convert to display currency if needed
    if (entryCurrency === displayCurrency) {
      // Same currency, no conversion needed
      currencyValue = totalValueInEntryCurrency;
    } else if (exchangeRates) {
      // Convert from entry currency to display currency
      try {
        currencyValue = convertCurrency(
          totalValueInEntryCurrency,
          entryCurrency,
          displayCurrency,
          exchangeRates
        );
      } catch (error) {
        console.error('Currency conversion error:', error);
        // Fallback to stored values
        currencyValue = getStoredValue(holding, displayCurrency);
      }
    } else {
      // No exchange rates available, use stored values
      currencyValue = getStoredValue(holding, displayCurrency);
    }
    
    // Validate consistency - log warnings if stored values don't match calculated
    validateStoredValues(holding, currencyValue, displayCurrency);
  } else {
    // Fallback to stored values when quantity or currentPrice is not available
    currencyValue = getStoredValue(holding, displayCurrency);
  }
  
  return currencyValue;
}

/**
 * Validate that stored values match calculated values
 */
function validateStoredValues(holding: Holding, calculatedValue: number, displayCurrency: CurrencyCode): void {
  const storedValue = getStoredValue(holding, displayCurrency);
  const difference = Math.abs(calculatedValue - storedValue);
  const tolerance = 0.01; // 1 cent tolerance for floating point errors
  
  if (difference > tolerance) {
    console.warn(`⚠️ Value mismatch for ${holding.symbol}:`, {
      calculated: calculatedValue,
      stored: storedValue,
      difference: difference.toFixed(2),
      currency: displayCurrency,
      quantity: holding.quantity,
      currentUnitPrice: holding.currentUnitPrice,
      unitPrice: holding.unitPrice
    });
  }
}

/**
 * Get stored value for a holding in specified currency
 */
function getStoredValue(holding: Holding, displayCurrency: CurrencyCode): number {
  switch (displayCurrency) {
    case 'SGD':
      return holding.valueSGD;
    case 'USD':
      return holding.valueUSD;
    case 'INR':
      return holding.valueINR;
    default:
      return holding.valueSGD; // Default to SGD
  }
}

/**
 * Calculate category breakdown from holdings
 */
export function calculateCategoryBreakdown(
  holdings: Holding[],
  displayCurrency: CurrencyCode,
  exchangeRates: ExchangeRates | null
): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  holdings.forEach(holding => {
    const category = holding.category;
    const value = calculateHoldingValue(holding, displayCurrency, exchangeRates);
    breakdown[category] = (breakdown[category] || 0) + value;
  });
  
  return breakdown;
}

/**
 * Calculate category percentages
 */
export function calculateCategoryPercentages(
  categoryBreakdown: Record<string, number>,
  totalValue: number
): Record<string, number> {
  const percentages: Record<string, number> = {};
  
  Object.entries(categoryBreakdown).forEach(([category, value]) => {
    percentages[category] = totalValue > 0 ? (value / totalValue) * 100 : 0;
  });
  
  return percentages;
} 