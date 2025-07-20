import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { symbol, price, note } = await request.json();
    
    if (!symbol || !price || isNaN(price)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Symbol and valid price required' 
      }, { status: 400 });
    }
    
    await prisma.holdings.updateMany({
      where: { symbol },
      data: {
        currentUnitPrice: parseFloat(price),
        priceUpdated: new Date(),
        priceSource: `manual${note ? `: ${note}` : ''}`
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      symbol,
      price: parseFloat(price),
      source: 'manual',
      note: note || 'Manual override',
      message: `${symbol} price manually set to ${price}`
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
