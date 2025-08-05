import { type CurrencyCode, type ExchangeRates, convertCurrency } from './currency';
import { APP_CONFIG } from './config';

// FI targets in SGD (base currency) - fallback defaults
export const FI_TARGETS_SGD = APP_CONFIG.FINANCIAL.FI_TARGETS;

export interface FITargets {
  firstMillion: number;
  leanFI: number;
  fullFI: number;
  customMilestones?: Array<{
    id: string;
    name: string;
    amount: number;
    description?: string;
    order: number;
  }>;
}

export interface FIMilestone {
  id: string;
  name: string;
  amount: number;
  description?: string;
  order: number;
  isActive: boolean;
}

/**
 * Fetch FI milestones from the database
 */
export async function fetchFIMilestones(): Promise<FIMilestone[]> {
  try {
    const response = await fetch('/api/fi-milestones');
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.milestones || [];
      }
    }
  } catch (error) {
    console.error('Failed to fetch FI milestones:', error);
  }
  return [];
}

/**
 * Get FI targets converted to the specified currency
 * Now supports both hardcoded defaults and dynamic milestones from database
 */
export async function getFITargets(
  displayCurrency: CurrencyCode,
  exchangeRates: ExchangeRates | null
): Promise<FITargets> {
  // Fetch custom milestones from database
  const customMilestones = await fetchFIMilestones();
  
  // Convert custom milestones to display currency
  const convertedMilestones = customMilestones.map(milestone => ({
    ...milestone,
    amount: convertCurrency(milestone.amount, 'SGD', displayCurrency, exchangeRates || {
      SGD_TO_USD: 1.35,
      SGD_TO_INR: 63.0,
      USD_TO_SGD: 1 / 1.35,
      USD_TO_INR: 1.35 * 63.0,
      INR_TO_SGD: 1 / 63.0,
      INR_TO_USD: 1 / (1.35 * 63.0)
    })
  }));

  // Use hardcoded defaults if no custom milestones exist
  if (customMilestones.length === 0) {
    if (!exchangeRates || displayCurrency === 'SGD') {
      return {
        firstMillion: FI_TARGETS_SGD.FIRST_MILLION,
        leanFI: FI_TARGETS_SGD.LEAN_FI,
        fullFI: FI_TARGETS_SGD.FULL_FI
      };
    }

    return {
      firstMillion: convertCurrency(FI_TARGETS_SGD.FIRST_MILLION, 'SGD', displayCurrency, exchangeRates),
      leanFI: convertCurrency(FI_TARGETS_SGD.LEAN_FI, 'SGD', displayCurrency, exchangeRates),
      fullFI: convertCurrency(FI_TARGETS_SGD.FULL_FI, 'SGD', displayCurrency, exchangeRates)
    };
  }

  // Use custom milestones, sorted by order
  const sortedMilestones = convertedMilestones.sort((a, b) => a.order - b.order);
  
  // For backward compatibility, map the first 3 milestones to the standard targets
  const firstMillion = sortedMilestones[0]?.amount || FI_TARGETS_SGD.FIRST_MILLION;
  const leanFI = sortedMilestones[1]?.amount || FI_TARGETS_SGD.LEAN_FI;
  const fullFI = sortedMilestones[2]?.amount || FI_TARGETS_SGD.FULL_FI;

  return {
    firstMillion,
    leanFI,
    fullFI,
    customMilestones: sortedMilestones
  };
}

/**
 * Synchronous version for backward compatibility
 */
export function getFITargetsSync(
  displayCurrency: CurrencyCode,
  exchangeRates: ExchangeRates | null
): FITargets {
  if (!exchangeRates || displayCurrency === 'SGD') {
    return {
      firstMillion: FI_TARGETS_SGD.FIRST_MILLION,
      leanFI: FI_TARGETS_SGD.LEAN_FI,
      fullFI: FI_TARGETS_SGD.FULL_FI
    };
  }

  return {
    firstMillion: convertCurrency(FI_TARGETS_SGD.FIRST_MILLION, 'SGD', displayCurrency, exchangeRates),
    leanFI: convertCurrency(FI_TARGETS_SGD.LEAN_FI, 'SGD', displayCurrency, exchangeRates),
    fullFI: convertCurrency(FI_TARGETS_SGD.FULL_FI, 'SGD', displayCurrency, exchangeRates)
  };
}

/**
 * Calculate FI progress percentage
 */
export function calculateFIProgress(
  currentValue: number,
  displayCurrency: CurrencyCode,
  exchangeRates: ExchangeRates | null
): {
  firstMillionProgress: number;
  leanFIProgress: number;
  fullFIProgress: number;
  currentStage: 'first_million' | 'lean_fi' | 'full_fi' | 'achieved';
} {
  const targets = getFITargetsSync(displayCurrency, exchangeRates);
  
  const firstMillionProgress = (currentValue / targets.firstMillion) * 100;
  const leanFIProgress = Math.max(0, ((currentValue - targets.firstMillion) / (targets.leanFI - targets.firstMillion)) * 100);
  const fullFIProgress = Math.max(0, ((currentValue - targets.leanFI) / (targets.fullFI - targets.leanFI)) * 100);

  let currentStage: 'first_million' | 'lean_fi' | 'full_fi' | 'achieved';
  if (currentValue < targets.firstMillion) {
    currentStage = 'first_million';
  } else if (currentValue < targets.leanFI) {
    currentStage = 'lean_fi';
  } else if (currentValue < targets.fullFI) {
    currentStage = 'full_fi';
  } else {
    currentStage = 'achieved';
  }

  return {
    firstMillionProgress,
    leanFIProgress,
    fullFIProgress,
    currentStage
  };
}

/**
 * Get the next milestone amount needed
 */
export function getNextMilestoneAmount(
  currentValue: number,
  displayCurrency: CurrencyCode,
  exchangeRates: ExchangeRates | null
): { amount: number; milestone: string } {
  const targets = getFITargetsSync(displayCurrency, exchangeRates);
  
  if (currentValue < targets.firstMillion) {
    return { amount: targets.firstMillion - currentValue, milestone: 'first million' };
  } else if (currentValue < targets.leanFI) {
    return { amount: targets.leanFI - currentValue, milestone: 'Lean FI' };
  } else if (currentValue < targets.fullFI) {
    return { amount: targets.fullFI - currentValue, milestone: 'Full FI' };
  } else {
    return { amount: 0, milestone: 'Financial Independence Achieved!' };
  }
} 