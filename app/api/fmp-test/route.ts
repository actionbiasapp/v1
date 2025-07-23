// app/api/fmp-test/route.ts - Test FMP API Integration

import { NextRequest, NextResponse } from 'next/server';
import { fmpApi, lookupNewCompany, validateNewSymbol } from '@/app/lib/fmpApi';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const query = searchParams.get('query');

  if (!symbol && !query) {
    return NextResponse.json({ 
      error: 'Please provide either symbol or query parameter' 
    }, { status: 400 });
  }

  try {
    let result;

    if (symbol) {
      // Test symbol validation
      const validation = await validateNewSymbol(symbol);
      result = { type: 'validation', data: validation };
    } else if (query) {
      // Test company lookup
      const lookup = await lookupNewCompany(query);
      result = { type: 'lookup', data: lookup };
    }

    return NextResponse.json({
      success: true,
      result,
      apiKeyConfigured: !!process.env.FMP_API_KEY
    });

  } catch (error) {
    console.error('FMP API test error:', error);
    return NextResponse.json({ 
      error: 'FMP API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, query } = body;

    if (!symbol && !query) {
      return NextResponse.json({ 
        error: 'Please provide either symbol or query in request body' 
      }, { status: 400 });
    }

    let result;

    if (symbol) {
      // Test symbol validation
      const validation = await validateNewSymbol(symbol);
      result = { type: 'validation', data: validation };
    } else if (query) {
      // Test company lookup
      const lookup = await lookupNewCompany(query);
      result = { type: 'lookup', data: lookup };
    }

    return NextResponse.json({
      success: true,
      result,
      apiKeyConfigured: !!process.env.FMP_API_KEY
    });

  } catch (error) {
    console.error('FMP API test error:', error);
    return NextResponse.json({ 
      error: 'FMP API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 