import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FMP_API_KEY = process.env.FMP_API_KEY || '';
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

export async function GET(req: NextRequest) {
  // Vercel's cron jobs require a GET handler to work, even if it's just for show.
  // We can also use this for manual triggering.
  if (req.method === 'GET') {
    // We'll just call the POST handler internally.
    // This allows manual runs via browser or curl.
    return POST(req);
  }
  return NextResponse.json({ message: "Live pricing system ready. Use POST to update." });
}

export async function POST(req: NextRequest) {
  const jobName = 'update-all-prices';
  let logId: string;

  // 1. Create initial log entry
  try {
    const logEntry = await prisma.cronJobLog.create({
      data: {
        jobName,
        status: 'PENDING',
        message: 'Cron job started...',
      },
    });
    logId = logEntry.id;
  } catch (error) {
    console.error('Failed to create initial cron job log:', error);
    // If logging fails, we can't proceed with a traceable job.
    return NextResponse.json(
      { success: false, error: 'Failed to initialize logging' },
      { status: 500 }
    );
  }

  try {
    const priceService = new DynamicPriceService();
    
    const holdings = await prisma.holdings.findMany({ select: { symbol: true } });
    const symbols = [...new Set(holdings.map(h => h.symbol))]; // Get unique symbols
    const results = [];
    
    for (const symbol of symbols) {
      const result = await priceService.updatePriceForSymbol(symbol);
      results.push(result);
      // Add a small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const summary = {
      updated: results.filter(r => r.action === 'updated').length,
      yesterday: results.filter(r => r.action === 'used_yesterday').length,
      failed: results.filter(r => r.action === 'failed').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      total: symbols.length
    };
    
    const successMessage = `Successfully updated ${summary.updated}/${summary.total} symbols. Used yesterday's price for ${summary.yesterday}. Failed: ${summary.failed}.`;

    // 2. Update log to SUCCESS
    await prisma.cronJobLog.update({
      where: { id: logId },
      data: {
        status: 'SUCCESS',
        message: successMessage,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      summary,
      results,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Cron job '${jobName}' failed:`, errorMessage);

    // 3. Update log to FAILURE
    await prisma.cronJobLog.update({
      where: { id: logId },
      data: {
        status: 'FAILURE',
        message: errorMessage,
      },
    });

    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}