// app/lib/portfolioCRUD.ts
// Portfolio CRUD utilities extracted from FixedPortfolioGrid.tsx

import { type CurrencyCode } from '@/app/lib/currency';
import { HoldingFormData } from '@/app/lib/types/shared';

// Currency conversion helper - FIXED API call
export async function convertToAllCurrencies(amount: number, fromCurrency: CurrencyCode) {
  try {
    const response = await fetch('/api/exchange-rates/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount, 
        fromCurrency, 
        toCurrency: 'SGD', // Fix: Use specific target currency instead of 'ALL'
        convertToAll: true  // Fix: Add convertToAll flag
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Conversion failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle different response formats
    if (data.SGD && data.USD && data.INR) {
      return {
        SGD: data.SGD,
        USD: data.USD,
        INR: data.INR
      };
    } else {
      // Fallback to individual conversions
      return await fallbackConversion(amount, fromCurrency);
    }
  } catch (error) {
    console.error('Currency conversion error:', error);
    return await fallbackConversion(amount, fromCurrency);
  }
}

// Fallback conversion with improved rates
async function fallbackConversion(amount: number, fromCurrency: CurrencyCode) {
  try {
    // Try to get current rates from the exchange rates API
    const ratesResponse = await fetch('/api/exchange-rates');
    if (ratesResponse.ok) {
      const ratesData = await ratesResponse.json();
      const rates = ratesData.rates;
      
      // Convert to SGD first, then to other currencies
      let sgdAmount = amount;
      if (fromCurrency === 'USD') {
        sgdAmount = amount * rates.USD_TO_SGD;
      } else if (fromCurrency === 'INR') {
        sgdAmount = amount * rates.INR_TO_SGD;
      }
      
      return {
        SGD: sgdAmount,
        USD: sgdAmount * rates.SGD_TO_USD,
        INR: sgdAmount * rates.SGD_TO_INR
      };
    }
  } catch (error) {
    console.error('Fallback conversion error:', error);
  }
  
  // Ultimate fallback with hardcoded rates
  const fallbackRates = { SGD: 1, USD: 0.74, INR: 63.5 };
  const sgdAmount = amount * (fallbackRates.SGD / fallbackRates[fromCurrency]);
  return {
    SGD: sgdAmount,
    USD: sgdAmount * fallbackRates.USD,
    INR: sgdAmount * fallbackRates.INR
  };
}

// Create new holding
export async function createHolding(formData: HoldingFormData, categoryName: string) {
  // Convert amount to all currencies
  const convertedValues = await convertToAllCurrencies(formData.amount, formData.currency);
  
  const holdingData = {
    symbol: formData.symbol.toUpperCase(),
    name: formData.name,
    valueSGD: convertedValues.SGD,
    valueINR: convertedValues.INR,
    valueUSD: convertedValues.USD,
    value: convertedValues.SGD, // Backward compatibility
    entryCurrency: formData.currency,
    category: categoryName,
    location: formData.location
  };

  const response = await fetch('/api/holdings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holdingData)
  });

  if (!response.ok) throw new Error('Failed to create holding');
  return response.json();
}

// Update existing holding
export async function updateHolding(holdingId: string, formData: HoldingFormData, categoryName: string) {
  // Convert amount to all currencies
  const convertedValues = await convertToAllCurrencies(formData.amount, formData.currency);
  
  const holdingData = {
    symbol: formData.symbol.toUpperCase(),
    name: formData.name,
    valueSGD: convertedValues.SGD,
    valueINR: convertedValues.INR,
    valueUSD: convertedValues.USD,
    value: convertedValues.SGD, // Backward compatibility
    entryCurrency: formData.currency,
    category: categoryName,
    location: formData.location
  };

  const response = await fetch(`/api/holdings/${holdingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holdingData)
  });

  if (!response.ok) throw new Error('Failed to update holding');
  return response.json();
}

// Delete holding
export async function deleteHolding(holdingId: string) {
  const response = await fetch(`/api/holdings/${holdingId}`, {
    method: 'DELETE'
  });

  if (!response.ok) throw new Error('Failed to delete holding');
  return response.json();
}

// Progress color helper
export function getProgressColor(status: string): string {
  switch (status) {
    case 'perfect': return '#10b981';
    case 'underweight': return '#f59e0b';
    case 'excess': return '#ef4444';
    default: return '#64748b';
  }
}