import { formatCurrency, type CurrencyCode } from './currency';

/**
 * Format currency with visibility toggle
 */
export function formatCurrencyWithVisibility(
  amount: number,
  currency: CurrencyCode,
  isVisible: boolean,
  options: { compact?: boolean; precision?: number } = {}
): string {
  if (!isVisible) {
    return '••••••';
  }
  return formatCurrency(amount, currency, options);
}

/**
 * Format number with visibility toggle
 */
export function formatNumberWithVisibility(
  value: number,
  isVisible: boolean,
  options: { 
    compact?: boolean; 
    precision?: number;
    locale?: boolean;
  } = {}
): string {
  if (!isVisible) {
    return '••••••';
  }
  
  const { compact = false, precision = 0, locale = true } = options;
  
  if (compact && (value >= 1000 || value <= -1000)) {
    const rounded = Math.round(value / 100) / 10;
    const formatted = rounded % 1 === 0 ? Math.round(rounded) : rounded;
    return `${formatted}k`;
  }
  
  if (locale) {
    return Math.round(value).toLocaleString(undefined, { maximumFractionDigits: precision });
  }
  
  return value.toFixed(precision);
}

/**
 * Format percentage with visibility toggle
 */
export function formatPercentageWithVisibility(
  value: number,
  isVisible: boolean,
  precision: number = 1
): string {
  if (!isVisible) {
    return '••••••';
  }
  return `${value.toFixed(precision)}%`;
}

/**
 * Format K-style numbers with visibility toggle
 */
export function formatKWithVisibility(
  value: number | null | undefined,
  isVisible: boolean
): string {
  if (!isVisible) {
    return '••••••';
  }
  
  if (value === null || value === undefined) {
    return '0';
  }
  if (value >= 1000 || value <= -1000) {
    const rounded = Math.round(value / 100) / 10;
    return `${rounded % 1 === 0 ? Math.round(rounded) : rounded}k`;
  }
  return Math.round(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
} 