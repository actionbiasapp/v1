// /app/api/exchange-rates/route.ts
// Main exchange rates API endpoint - FIXED VERSION

import { NextResponse } from 'next/server';
import { getCurrentExchangeRates, refreshExchangeRates } from '@/app/lib/exchangeRates';

// FIXED: Removed unused 'request' parameter from GET
export async function GET() {
  try {
    const rates = await getCurrentExchangeRates();
    
    return NextResponse.json({
      success: true,
      rates,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch exchange rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action === 'refresh') {
      const rates = await refreshExchangeRates();
      
      return NextResponse.json({
        success: true,
        message: 'Exchange rates refreshed',
        rates,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error in exchange rates POST:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}