// /lib/exchangeRates.ts
// Exchange rate fetching and caching service

import { PrismaClient } from '@prisma/client';
import { fetchLiveExchangeRates, needsRateUpdate, type ExchangeRates, type CurrencyCode } from './currency';

const prisma = new PrismaClient();

/**
 * Get current exchange rates with automatic refresh logic
 */
export async function getCurrentExchangeRates(): Promise<ExchangeRates> {
  try {
    // Check if we have recent rates in database
    const recentRates = await prisma.exchangeRate.findMany({
      where: {
        isActive: true,
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Within last hour
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // If we have recent rates, use them
    if (recentRates.length >= 6) { // We need 6 rate pairs
      return convertDbRatesToExchangeRates(recentRates);
    }

    // Otherwise, fetch fresh rates
    console.log('Fetching fresh exchange rates...');
    return await refreshExchangeRates();
    
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    
    // Fallback to any cached rates we have
    const fallbackRates = await prisma.exchangeRate.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 6
    });
    
    if (fallbackRates.length >= 6) {
      console.log('Using fallback cached rates');
      return convertDbRatesToExchangeRates(fallbackRates);
    }
    
    // Ultimate fallback to default rates
    console.log('Using default exchange rates');
    return {
      SGD_TO_USD: 0.74,
      SGD_TO_INR: 63.50,
      USD_TO_SGD: 1.35,
      USD_TO_INR: 85.50,
      INR_TO_SGD: 0.0157,
      INR_TO_USD: 0.0117
    };
  }
}

/**
 * Force refresh exchange rates from external API
 */
export async function refreshExchangeRates(): Promise<ExchangeRates> {
  try {
    const liveRates = await fetchLiveExchangeRates();
    
    // Deactivate old rates
    await prisma.exchangeRate.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
    
    // Store new rates
    const rateEntries = [
      { fromCurrency: 'SGD', toCurrency: 'USD', rate: liveRates.SGD_TO_USD },
      { fromCurrency: 'SGD', toCurrency: 'INR', rate: liveRates.SGD_TO_INR },
      { fromCurrency: 'USD', toCurrency: 'SGD', rate: liveRates.USD_TO_SGD },
      { fromCurrency: 'USD', toCurrency: 'INR', rate: liveRates.USD_TO_INR },
      { fromCurrency: 'INR', toCurrency: 'SGD', rate: liveRates.INR_TO_SGD },
      { fromCurrency: 'INR', toCurrency: 'USD', rate: liveRates.INR_TO_USD }
    ];
    
    await prisma.exchangeRate.createMany({
      data: rateEntries.map(entry => ({
        ...entry,
        rate: entry.rate,
        source: 'api',
        isActive: true
      }))
    });
    
    console.log('Exchange rates refreshed successfully');
    return liveRates;
    
  } catch (error) {
    console.error('Failed to refresh exchange rates:', error);
    throw error;
  }
}

/**
 * Set manual exchange rates (admin override)
 */
export async function setManualExchangeRates(rates: ExchangeRates): Promise<void> {
  try {
    // Deactivate current rates
    await prisma.exchangeRate.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });
    
    // Store manual rates
    const rateEntries = [
      { fromCurrency: 'SGD', toCurrency: 'USD', rate: rates.SGD_TO_USD },
      { fromCurrency: 'SGD', toCurrency: 'INR', rate: rates.SGD_TO_INR },
      { fromCurrency: 'USD', toCurrency: 'SGD', rate: rates.USD_TO_SGD },
      { fromCurrency: 'USD', toCurrency: 'INR', rate: rates.USD_TO_INR },
      { fromCurrency: 'INR', toCurrency: 'SGD', rate: rates.INR_TO_SGD },
      { fromCurrency: 'INR', toCurrency: 'USD', rate: rates.INR_TO_USD }
    ];
    
    await prisma.exchangeRate.createMany({
      data: rateEntries.map(entry => ({
        ...entry,
        rate: entry.rate,
        source: 'manual',
        isActive: true
      }))
    });
    
    console.log('Manual exchange rates set successfully');
    
  } catch (error) {
    console.error('Failed to set manual exchange rates:', error);
    throw error;
  }
}

/**
 * Convert database rate records to ExchangeRates object
 */
function convertDbRatesToExchangeRates(dbRates: any[]): ExchangeRates {
  const rateMap: Record<string, number> = {};
  
  dbRates.forEach(rate => {
    const key = `${rate.fromCurrency}_TO_${rate.toCurrency}`;
    rateMap[key] = Number(rate.rate);
  });
  
  return {
    SGD_TO_USD: rateMap['SGD_TO_USD'] || 0.74,
    SGD_TO_INR: rateMap['SGD_TO_INR'] || 63.50,
    USD_TO_SGD: rateMap['USD_TO_SGD'] || 1.35,
    USD_TO_INR: rateMap['USD_TO_INR'] || 85.50,
    INR_TO_SGD: rateMap['INR_TO_SGD'] || 0.0157,
    INR_TO_USD: rateMap['INR_TO_USD'] || 0.0117
  };
}

/**
 * Get exchange rate history for analysis
 */
export async function getExchangeRateHistory(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  days: number = 30
): Promise<Array<{ rate: number; date: Date; source: string }>> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const history = await prisma.exchangeRate.findMany({
    where: {
      fromCurrency,
      toCurrency,
      createdAt: { gte: startDate }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      rate: true,
      createdAt: true,
      source: true
    }
  });
  
  return history.map(record => ({
    rate: Number(record.rate),
    date: record.createdAt,
    source: record.source
  }));
}

/**
 * Initialize exchange rates on first run
 */
export async function initializeExchangeRates(): Promise<void> {
  const existingRates = await prisma.exchangeRate.count();
  
  if (existingRates === 0) {
    console.log('Initializing exchange rates for first time...');
    await refreshExchangeRates();
  }
}