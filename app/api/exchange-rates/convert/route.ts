// /app/api/exchange-rates/convert.ts
// Currency conversion API endpoint - FIXED PATH

import { NextRequest, NextResponse } from 'next/server';
import { convertCurrency, convertToAllCurrencies, type CurrencyCode } from '@/app/lib/currency';
import { getCurrentExchangeRates } from '@/app/lib/exchangeRates';

export async function POST(request: NextRequest) {
  try {
    const { 
      amount, 
      fromCurrency, 
      toCurrency, 
      convertToAll = false 
    } = await request.json();
    
    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }
    
    if (!fromCurrency || !['SGD', 'INR', 'USD'].includes(fromCurrency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid fromCurrency' },
        { status: 400 }
      );
    }
    
    if (!convertToAll && (!toCurrency || !['SGD', 'INR', 'USD'].includes(toCurrency))) {
      return NextResponse.json(
        { success: false, error: 'Invalid toCurrency' },
        { status: 400 }
      );
    }
    
    const rates = await getCurrentExchangeRates();
    
    if (convertToAll || toCurrency === 'ALL') {
      const allValues = convertToAllCurrencies(amount, fromCurrency as CurrencyCode, rates);
      
      return NextResponse.json({
        success: true,
        SGD: allValues.valueSGD,
        USD: allValues.valueUSD, 
        INR: allValues.valueINR,
        rates: rates,
        timestamp: new Date().toISOString()
      });
    } else {
      const convertedAmount = convertCurrency(
        amount, 
        fromCurrency as CurrencyCode, 
        toCurrency as CurrencyCode, 
        rates
      );
      
      return NextResponse.json({
        success: true,
        conversion: {
          originalAmount: amount,
          fromCurrency,
          toCurrency,
          convertedAmount,
          rate: rates[`${fromCurrency}_TO_${toCurrency}` as keyof typeof rates]
        },
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error in currency conversion:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to convert currency',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}