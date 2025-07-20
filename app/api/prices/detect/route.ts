import { NextRequest, NextResponse } from 'next/server';
import { PriceDetectionService } from '../../../lib/priceDetection';

export async function POST(request: NextRequest) {
  try {
    const { symbol } = await request.json();
    
    if (!symbol || symbol.length < 1) {
      return NextResponse.json({ 
        error: 'Symbol is required' 
      }, { status: 400 });
    }
    
    const detector = new PriceDetectionService();
    const result = await detector.detectPriceSource(symbol);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Price detection error:', error);
    return NextResponse.json({ 
      symbol: '',
      supportsAutoPricing: false,
      source: 'manual',
      currency: 'USD',
      confidence: 'low',
      error: error instanceof Error ? error.message : "Detection failed" 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "POST to detect price source for a symbol",
    usage: "POST { symbol: 'AAPL' }"
  });
}
