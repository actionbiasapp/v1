import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { APP_CONFIG } from '@/app/lib/config';

const prisma = new PrismaClient();
const FMP_API_KEY = process.env.FMP_API_KEY || '';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

// Define the source type union to include 'yesterday'
type PriceSource = 'fmp' | 'alpha' | 'coingecko' | 'manual' | 'yesterday';

class DynamicPriceService {
  detectPriceSource(symbol: string): 'fmp' | 'alpha' | 'coingecko' | 'manual' {
    if (['BTC', 'ETH', 'WBTC', 'USDC'].includes(symbol)) return 'coingecko';
    if (symbol.includes('CASH') || symbol === 'NIFTY100' || symbol === 'GOLD' || ['DBS', 'IBKR', 'SC'].includes(symbol)) return 'manual';
    if (symbol.endsWith('.L') || symbol.endsWith('.SI')) return 'alpha';
    return 'fmp';
  }

  async fetchFMPPrice(symbol: string): Promise<number | null> {
    try {
      const response = await fetch(`${FMP_BASE_URL}/quote-short/${symbol}?apikey=${FMP_API_KEY}`);
      if (!response.ok) return null;
      const data = await response.json();
      const price = data[0]?.price || null;
      // Round to 2 decimal places for consistency
      return price ? Math.round(price * 100) / 100 : null;
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
      const price = data[coinId]?.usd || null;
      // Round to 2 decimal places for consistency
      return price ? Math.round(price * 100) / 100 : null;
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
    let failReason = '';
    if (source === 'manual') {
      return { symbol, price: null, source: 'manual', action: 'skipped' };
    }

    let price: number | null = null;
    let finalSource: PriceSource = source;
    
    try {
    if (source === 'fmp') {
      price = await this.fetchFMPPrice(symbol);
        if (price === null) failReason = 'FMP API returned null';
    } else if (source === 'alpha') {
      price = await this.fetchAlphaPrice(symbol);
        if (price === null) failReason = 'Alpha Vantage API returned null';
    } else if (source === 'coingecko') {
      price = await this.fetchCryptoPrice(symbol);
        if (price === null) failReason = 'CoinGecko API returned null';
      }
    } catch (error) {
      failReason = error instanceof Error ? error.message : 'Unknown error';
    }

    if (price === null) {
      price = await this.getYesterdayPrice(symbol);
      if (price !== null) {
        finalSource = 'yesterday';
      } else {
        failReason = failReason || 'No price found (API and yesterday)';
      }
    }

    if (price !== null && finalSource !== 'yesterday') {
      try {
        // Fetch the latest USD->SGD rate
        let usdToSgdRate = 1;
        const rateRow = await prisma.exchangeRate.findFirst({
          where: {
            fromCurrency: { equals: 'USD', mode: 'insensitive' },
            toCurrency: { equals: 'SGD', mode: 'insensitive' },
            isActive: true
          },
          orderBy: { updatedAt: 'desc' }
        });
        if (rateRow && rateRow.rate) {
          usdToSgdRate = Number(rateRow.rate);
        }
        // Get all holdings for this symbol
        const holdingsToUpdate = await prisma.holdings.findMany({
          where: { symbol: { equals: symbol, mode: 'insensitive' } }
        });
        for (const holding of holdingsToUpdate) {
          // Skip holdings with manual pricing or manual asset type
          if (holding.priceSource === 'manual' || holding.assetType === 'manual') {
            continue;
          }
          let valueSGD = 0;
          let currentUnitPrice = price;
          const qty = holding.quantity ? Number(holding.quantity) : 0;
          
          // Handle crypto prices (CoinGecko returns USD prices)
          if (finalSource === 'coingecko' || source === 'coingecko') {
            if (holding.entryCurrency === 'SGD') {
              // Convert USD price to SGD for storage
              currentUnitPrice = price * usdToSgdRate;
              valueSGD = currentUnitPrice * qty;
            } else {
              // Keep USD price if entryCurrency is USD
              valueSGD = price * qty * usdToSgdRate;
            }
          } else if (holding.entryCurrency === 'SGD') {
            valueSGD = price * qty;
          } else if (holding.entryCurrency === 'USD') {
            valueSGD = price * qty * usdToSgdRate;
          } else {
            valueSGD = price * qty; // fallback
          }
          
          await prisma.holdings.update({
            where: { id: holding.id },
            data: {
              currentUnitPrice: currentUnitPrice,
              priceUpdated: new Date(),
              priceSource: finalSource,
              valueSGD
            }
          });
        }
      } catch (error) {
        failReason = error instanceof Error ? error.message : 'DB update error';
        console.error(`Database update error for ${symbol}:`, error);
      }
    }

    return { 
      symbol, 
      price, 
      source: finalSource, 
      action: price !== null ? (finalSource === 'yesterday' ? 'used_yesterday' : 'updated') : 'failed',
      failReason: price === null || failReason ? failReason : undefined
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
    
    const failedDetails = results.filter(r => r.action === 'failed').map(r => `${r.symbol}: ${r.failReason}`).join('; ');
    const successMessage = `Successfully updated ${summary.updated}/${summary.total} symbols. Used yesterday's price for ${summary.yesterday}. Failed: ${summary.failed}. ${failedDetails ? 'Failures: ' + failedDetails : ''}`;

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