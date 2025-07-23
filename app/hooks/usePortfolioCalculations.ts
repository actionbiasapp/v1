'use client';

import { useMemo } from 'react';
import { type CurrencyCode } from '@/app/lib/currency';
import { type Holding } from '@/app/lib/types/shared';
import { 
  calculatePortfolioValue, 
  type ExchangeRates, 
  type PortfolioCalculationResult 
} from '@/app/lib/portfolioCalculations';

interface UsePortfolioCalculationsProps {
  holdings: Holding[];
  displayCurrency: CurrencyCode;
  exchangeRates: ExchangeRates | null;
}

export function usePortfolioCalculations({
  holdings,
  displayCurrency,
  exchangeRates
}: UsePortfolioCalculationsProps): PortfolioCalculationResult {
  
  return useMemo(() => {
    return calculatePortfolioValue(holdings, displayCurrency, exchangeRates);
  }, [holdings, displayCurrency, exchangeRates]);
} 