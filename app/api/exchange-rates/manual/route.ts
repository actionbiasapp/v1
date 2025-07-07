// /app/api/exchange-rates/manual.ts
// Manual rate override endpoint

import { NextRequest, NextResponse } from 'next/server';
import { setManualExchangeRates } from '@/app/lib/exchangeRates'; // ✅ FIXED: Correct import path
import { type ExchangeRates } from '@/app/lib/currency'; // ✅ FIXED: Correct import path

export async function PUT(request: NextRequest) {
  try {
    const { rates }: { rates: ExchangeRates } = await request.json();
    
    // Validate rates object
    const requiredRates = [
      'SGD_TO_USD', 'SGD_TO_INR', 'USD_TO_SGD', 
      'USD_TO_INR', 'INR_TO_SGD', 'INR_TO_USD'
    ];
    
    for (const rateKey of requiredRates) {
      if (!(rateKey in rates) || typeof rates[rateKey as keyof ExchangeRates] !== 'number') {
        return NextResponse.json(
          { success: false, error: `Missing or invalid rate: ${rateKey}` },
          { status: 400 }
        );
      }
    }
    
    await setManualExchangeRates(rates);
    
    return NextResponse.json({
      success: true,
      message: 'Manual exchange rates set successfully',
      rates,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error setting manual rates:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set manual rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}