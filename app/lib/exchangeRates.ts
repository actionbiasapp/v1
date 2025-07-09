// app/lib/exchangeRates.ts - Fixed version with proper upsert logic

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExchangeRates {
  SGD_TO_USD: number;
  SGD_TO_INR: number;
  USD_TO_SGD: number;
  USD_TO_INR: number;
  INR_TO_SGD: number;
  INR_TO_USD: number;
}

// Default fallback rates
const DEFAULT_RATES: ExchangeRates = {
  SGD_TO_USD: 0.74,
  SGD_TO_INR: 63.50,
  USD_TO_SGD: 1.35,
  USD_TO_INR: 85.50,
  INR_TO_SGD: 0.0157,
  INR_TO_USD: 0.0117
};

export async function getCurrentExchangeRates(): Promise<ExchangeRates> {
  try {
    // Check if we have recent rates (less than 1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRates = await prisma.exchangeRate.findMany({
      where: {
        isActive: true,
        updatedAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentRates.length >= 6) {
      // We have recent rates, use them
      const rates: Partial<ExchangeRates> = {};
      recentRates.forEach(rate => {
        const key = `${rate.fromCurrency}_TO_${rate.toCurrency}` as keyof ExchangeRates;
        rates[key] = Number(rate.rate);
      });
      
      // Ensure we have all required rates
      if (Object.keys(rates).length === 6) {
        return rates as ExchangeRates;
      }
    }

    // Need to refresh rates
    console.log('Refreshing exchange rates...');
    return await refreshExchangeRates();
    
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    console.log('Using default exchange rates');
    return DEFAULT_RATES;
  }
}

export async function refreshExchangeRates(): Promise<ExchangeRates> {
  try {
    console.log('Fetching fresh exchange rates...');
    
    // Fetch from exchangerate-api.com
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const rates = data.rates;
    
    if (!rates || !rates.SGD || !rates.INR) {
      throw new Error('Invalid API response structure');
    }

    // Calculate all required rates
    const liveRates = {
      SGD_TO_USD: 1 / rates.SGD,
      SGD_TO_INR: rates.INR / rates.SGD,
      USD_TO_SGD: rates.SGD,
      USD_TO_INR: rates.INR,
      INR_TO_SGD: rates.SGD / rates.INR,
      INR_TO_USD: 1 / rates.INR
    };

    // FIXED: Use upsert pattern instead of createMany to avoid duplicates
    const rateEntries = [
      { fromCurrency: 'SGD', toCurrency: 'USD', rate: liveRates.SGD_TO_USD },
      { fromCurrency: 'SGD', toCurrency: 'INR', rate: liveRates.SGD_TO_INR },
      { fromCurrency: 'USD', toCurrency: 'SGD', rate: liveRates.USD_TO_SGD },
      { fromCurrency: 'USD', toCurrency: 'INR', rate: liveRates.USD_TO_INR },
      { fromCurrency: 'INR', toCurrency: 'SGD', rate: liveRates.INR_TO_SGD },
      { fromCurrency: 'INR', toCurrency: 'USD', rate: liveRates.INR_TO_USD }
    ];

    // Use individual upsert operations instead of createMany
    await Promise.all(
      rateEntries.map(entry =>
        prisma.exchangeRate.upsert({
          where: {
            fromCurrency_toCurrency: {
              fromCurrency: entry.fromCurrency,
              toCurrency: entry.toCurrency
            }
          },
          update: {
            rate: entry.rate,
            source: 'api',
            isActive: true,
            updatedAt: new Date()
          },
          create: {
            fromCurrency: entry.fromCurrency,
            toCurrency: entry.toCurrency,
            rate: entry.rate,
            source: 'api',
            isActive: true
          }
        })
      )
    );

    console.log('Exchange rates updated successfully');
    return liveRates;
    
  } catch (error) {
    console.error('Failed to refresh exchange rates:', error);
    console.log('Using default exchange rates');
    return DEFAULT_RATES;
  }
}

export async function setManualExchangeRates(rates: Partial<ExchangeRates>): Promise<void> {
  try {
    const updates = Object.entries(rates).map(([key, value]) => {
      const [fromCurrency, toCurrency] = key.split('_TO_');
      return {
        fromCurrency,
        toCurrency,
        rate: value
      };
    });

    await Promise.all(
      updates.map(update =>
        prisma.exchangeRate.upsert({
          where: {
            fromCurrency_toCurrency: {
              fromCurrency: update.fromCurrency,
              toCurrency: update.toCurrency
            }
          },
          update: {
            rate: update.rate,
            source: 'manual',
            isActive: true,
            updatedAt: new Date()
          },
          create: {
            fromCurrency: update.fromCurrency,
            toCurrency: update.toCurrency,
            rate: update.rate,
            source: 'manual',
            isActive: true
          }
        })
      )
    );
    
    console.log('Manual exchange rates set successfully');
  } catch (error) {
    console.error('Error setting manual exchange rates:', error);
    throw error;
  }
}

export async function getExchangeRateHistory(): Promise<any[]> {
  try {
    return await prisma.exchangeRate.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50
    });
  } catch (error) {
    console.error('Error fetching exchange rate history:', error);
    return [];
  }
}

export async function initializeExchangeRates(): Promise<void> {
  try {
    const existingRates = await prisma.exchangeRate.count();
    
    if (existingRates === 0) {
      console.log('Initializing exchange rates...');
      await refreshExchangeRates();
    }
  } catch (error) {
    console.error('Error initializing exchange rates:', error);
  }
}