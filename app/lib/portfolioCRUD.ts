// app/lib/portfolioCRUD.ts
// Enhanced Portfolio CRUD utilities with weighted average support

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
        toCurrency: 'SGD',
        convertToAll: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Conversion failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.SGD && data.USD && data.INR) {
      return {
        SGD: data.SGD,
        USD: data.USD,
        INR: data.INR
      };
    } else {
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
    const ratesResponse = await fetch('/api/exchange-rates');
    if (ratesResponse.ok) {
      const ratesData = await ratesResponse.json();
      const rates = ratesData.rates;
      
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
  
  const fallbackRates = { SGD: 1, USD: 0.74, INR: 63.5 };
  const sgdAmount = amount * (fallbackRates.SGD / fallbackRates[fromCurrency]);
  return {
    SGD: sgdAmount,
    USD: sgdAmount * fallbackRates.USD,
    INR: sgdAmount * fallbackRates.INR
  };
}

// Enhanced create holding with weighted average support
export async function createHolding(formData: HoldingFormData, categoryName: string) {
  // Check if this is a confirmed holding with calculated values
  const isConfirmedHolding = formData._confirmedQuantity && formData._confirmedUnitPrice;
  
  let convertedValues;
  let holdingData;
  
  if (isConfirmedHolding) {
    // Use confirmed total cost for conversion
    const confirmedTotalCost = formData._confirmedTotalCost || formData.amount;
    convertedValues = await convertToAllCurrencies(confirmedTotalCost, formData.currency);
    
    holdingData = {
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      valueSGD: convertedValues.SGD,
      valueINR: convertedValues.INR,
      valueUSD: convertedValues.USD,
      value: convertedValues.SGD, // Backward compatibility
      entryCurrency: formData.currency,
      category: categoryName,
      location: formData.location,
      
      // Enhanced fields for live pricing
      quantity: formData._confirmedQuantity,
      unitPrice: formData._confirmedUnitPrice,
      currentUnitPrice: formData._confirmedUnitPrice, // Start with purchase price
      costBasis: confirmedTotalCost,
      priceSource: formData._priceSource || 'manual',
      priceUpdated: formData._enableAutoPricing ? new Date().toISOString() : null
    };
  } else {
    // Original flow for non-confirmed holdings
    convertedValues = await convertToAllCurrencies(formData.amount, formData.currency);
    
    holdingData = {
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      valueSGD: convertedValues.SGD,
      valueINR: convertedValues.INR,
      valueUSD: convertedValues.USD,
      value: convertedValues.SGD,
      entryCurrency: formData.currency,
      category: categoryName,
      location: formData.location
    };
  }

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
  const convertedValues = await convertToAllCurrencies(formData.amount, formData.currency);
  
  const holdingData = {
    symbol: formData.symbol.toUpperCase(),
    name: formData.name,
    valueSGD: convertedValues.SGD,
    valueINR: convertedValues.INR,
    valueUSD: convertedValues.USD,
    value: convertedValues.SGD,
    entryCurrency: formData.currency,
    category: categoryName,
    location: formData.location,
    quantity: formData.quantity ?? formData._confirmedQuantity ?? null,
    unitPrice: formData.unitPrice ?? formData._confirmedUnitPrice ?? null,
    currentUnitPrice: formData.currentUnitPrice ?? null,
    manualPricing: formData.manualPricing ?? false,
    assetType: formData.assetType || null
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
