'use client';

import { useMemo } from 'react';
import { type CurrencyCode } from '@/app/lib/currency';
import { convertCurrency } from '@/app/lib/currency';
import { type Holding } from '@/app/lib/types/shared';

interface UsePortfolioCalculationsProps {
  holdings: Holding[];
  displayCurrency: CurrencyCode;
  exchangeRates: any;
}

export function usePortfolioCalculations({
  holdings,
  displayCurrency,
  exchangeRates
}: UsePortfolioCalculationsProps) {
  
  const calculations = useMemo(() => {
    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, holding) => {
      let currencyValue = 0;
      
      // Always calculate dynamically using currentPrice × quantity when available
      if (holding.quantity && (holding as any).currentUnitPrice) {
        const quantity = holding.quantity;
        const currentPrice = (holding as any).currentUnitPrice;
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
            currencyValue = displayCurrency === 'SGD' ? holding.valueSGD :
                           displayCurrency === 'USD' ? holding.valueUSD :
                           holding.valueINR;
          }
        } else {
          // No exchange rates available, use stored values
          currencyValue = displayCurrency === 'SGD' ? holding.valueSGD :
                         displayCurrency === 'USD' ? holding.valueUSD :
                         holding.valueINR;
        }
      } else {
        // Fallback to stored values when quantity or currentPrice is not available
        currencyValue = displayCurrency === 'SGD' ? holding.valueSGD :
                       displayCurrency === 'USD' ? holding.valueUSD :
                       holding.valueINR;
      }
      
      return sum + currencyValue;
    }, 0);

    // Calculate individual holding values
    const holdingValues = holdings.map(holding => {
      let currencyValue = 0;
      
      // Always calculate dynamically using currentPrice × quantity when available
      if (holding.quantity && (holding as any).currentUnitPrice) {
        const quantity = holding.quantity;
        const currentPrice = (holding as any).currentUnitPrice;
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
            currencyValue = displayCurrency === 'SGD' ? holding.valueSGD :
                           displayCurrency === 'USD' ? holding.valueUSD :
                           holding.valueINR;
          }
        } else {
          // No exchange rates available, use stored values
          currencyValue = displayCurrency === 'SGD' ? holding.valueSGD :
                         displayCurrency === 'USD' ? holding.valueUSD :
                         holding.valueINR;
        }
      } else {
        // Fallback to stored values when quantity or currentPrice is not available
        currencyValue = displayCurrency === 'SGD' ? holding.valueSGD :
                       displayCurrency === 'USD' ? holding.valueUSD :
                       holding.valueINR;
      }
      
      return {
        ...holding,
        calculatedValue: currencyValue
      };
    });

    return {
      totalValue,
      holdingValues
    };
  }, [holdings, displayCurrency, exchangeRates]);

  return calculations;
} 