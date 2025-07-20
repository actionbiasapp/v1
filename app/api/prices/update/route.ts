import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FMP_API_KEY = '9ERUMtxQIBjyPwr5hTMVKSG9irnMBdin';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

// Define the source type union to include 'yesterday'
type PriceSource = 'fmp' | 'alpha' | 'coingecko' | 'manual' | 'yesterday';

class DynamicPriceService {
  detectPriceSource(symbol: string): 'fmp' | 'alpha' | 'coingecko' | 'manual' {
    if (['BTC', 'ETH', 'WBTC', 'USDC'].includes(symbol)) return 'coingecko';
    if (symbol.includes('CASH') || symbol === 'NIFTY100' || symbol === 'GOLD') return 'manual';
    if (symbol.endsWith('.L') || symbol.endsWith('.SI')) return 'alpha';
    return 'fmp';
  }

  async fetchFMPPrice(symbol: string): Promise<number | null> {
    try {
      const response = await fetch(`${FMP_BASE_URL}/quote-short/${symbol}?apikey=${FMP_API_KEY}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data[0]?.price || null;
    } catch (error) {
      return null;
    }
  }

  async fetchAlphaPrice(symbol: string): Promise<number | null> {
    try {
      const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`);
      const data = await response.json();
      const globalQuote = data['Global Quote'];
      const price = globalQuote ? globalQuote['05. price'] : null;
      return price ? parseFloat(price) : null;
    } catch (error) {
      return null;
    }
  }

  async fetchCryptoPrice(symbol: string): Promise<number | null> {
    const coinMap: Record<string, string> = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'WBTC': 'wrapped-bitcoin', 'USDC': 'usd-coin' };
    const coinId = coinMap[symbol];
    if (!coinId) return null;

    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      const data = await response.json();
      return data[coinId]?.usd || null;
    } catch (error) {
      return null;
    }
  }

  async getYesterdayPrice(symbol: string): Promise<number | null> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const holding = await prisma.holdings.findFirst({
        where: { 
          symbol,
          priceUpdated: { gte: yesterday },
          currentUnitPrice: { not: null, gt: 0 }
        },
        orderBy: { priceUpdated: 'desc' }
      });
      return holding?.currentUnitPrice ? Number(holding.currentUnitPrice) : null;
    } catch (error) {
      return null;
    }
  }

  async updatePriceForSymbol(symbol: string) {
    const source = this.detectPriceSource(symbol);
    
    if (source === 'manual') {
      return { symbol, price: null, source: 'manual', action: 'skipped' };
    }

    let price: number | null = null;
    let finalSource: PriceSource = source; // ✅ FIXED: Explicitly typed to allow 'yesterday'
    
    if (source === 'fmp') {
      price = await this.fetchFMPPrice(symbol);
    } else if (source === 'alpha') {
      price = await this.fetchAlphaPrice(symbol);
    } else if (source === 'coingecko') {
      price = await this.fetchCryptoPrice(symbol);
    }

    if (price === null) {
      price = await this.getYesterdayPrice(symbol);
      if (price !== null) {
        finalSource = 'yesterday'; // ✅ FIXED: Now TypeScript allows this assignment
      }
    }

    if (price !== null && finalSource !== 'yesterday') {
      try {
        await prisma.holdings.updateMany({
          where: { symbol },
          data: {
            currentUnitPrice: price,
            priceUpdated: new Date(),
            priceSource: finalSource
          }
        });
      } catch (error) {
        console.error(`Database update error for ${symbol}:`, error);
      }
    }

    return { 
      symbol, 
      price, 
      source: finalSource, 
      action: price !== null ? (finalSource === 'yesterday' ? 'used_yesterday' : 'updated') : 'failed'
    };
  }
}

export async function GET() {
  return NextResponse.json({ message: "Live pricing system ready. Use POST to update." });
}

export async function POST() {
  try {
    const priceService = new DynamicPriceService();
    
    const holdings = await prisma.holdings.findMany({ select: { symbol: true } });
    const testSymbols = holdings.map(h => h.symbol);
    const results = [];
    
    for (const symbol of testSymbols) {
      const result = await priceService.updatePriceForSymbol(symbol);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return NextResponse.json({ 
      success: true, 
      results,
      routing: results.map(r => ({ symbol: r.symbol, detectedSource: r.source })),
      summary: {
        updated: results.filter(r => r.action === 'updated').length,
        yesterday: results.filter(r => r.action === 'used_yesterday').length,
        failed: results.filter(r => r.action === 'failed').length
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}