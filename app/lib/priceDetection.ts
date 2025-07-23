export interface PriceDetectionResult {
  symbol: string;
  supportsAutoPricing: boolean;
  source: 'fmp' | 'coingecko' | 'manual';
  currentPrice?: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  companyName?: string;  // NEW: Auto-populated company name
  industry?: string;     // NEW: Industry information
  existingHoldings?: Array<{  // NEW: Existing holdings for this symbol
    id: string;
    name: string;
    location: string;
    valueUSD: number;
  }>;
  error?: string;
  assetType?: 'stock' | 'crypto' | 'manual'; // NEW
}

import { config } from './config';

export class PriceDetectionService {
  private readonly FMP_API_KEY: string;
  private readonly FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

  constructor() {
    this.FMP_API_KEY = config.FMP_API_KEY;
    if (!this.FMP_API_KEY) {
      console.warn('FMP_API_KEY is not set. Price detection for stocks will fail.');
    }
  }

  async detectPriceSource(symbol: string, assetType?: 'stock' | 'crypto' | 'manual'): Promise<PriceDetectionResult> {
    try {
      // User-specified routing
      if (assetType === 'crypto') {
        const result = await this.fetchCryptoPrice(symbol);
        return { ...result, assetType };
      }
      if (assetType === 'stock') {
        const result = await this.fetchFMPPrice(symbol);
        return { ...result, assetType };
      }
      if (assetType === 'manual') {
        return {
          symbol,
          supportsAutoPricing: false,
          source: 'manual',
          currency: 'USD',
          confidence: 'low',
          assetType: 'manual'
        };
      }
      // Fallback: auto-detection for backward compatibility
      const priceResult = await this.detectBasicPricing(symbol);
      const enhanced = await this.enhanceWithCompanyData(symbol, priceResult);
      return { ...enhanced, assetType: enhanced.source === 'fmp' ? 'stock' : enhanced.source === 'coingecko' ? 'crypto' : 'manual' };
    } catch (error) {
      console.error('Enhanced price detection failed:', error);
      return {
        symbol,
        supportsAutoPricing: false,
        source: 'manual',
        currency: 'USD',
        confidence: 'low',
        error: error instanceof Error ? error.message : 'Detection failed',
        assetType: 'manual'
      };
    }
  }

  private async fetchFMPPrice(symbol: string): Promise<PriceDetectionResult> {
    try {
      const response = await fetch(`${this.FMP_BASE_URL}/quote/${symbol}?apikey=${this.FMP_API_KEY}`);
      const data = await response.json();
      if (data && data[0] && data[0].price) {
        return {
          symbol,
          supportsAutoPricing: true,
          source: 'fmp',
          currentPrice: data[0].price,
          currency: 'USD',
          confidence: 'high',
          assetType: 'stock'
        };
      }
    } catch (error) {
      console.error('FMP detection failed:', error);
    }
    return {
      symbol,
      supportsAutoPricing: false,
      source: 'manual',
      currency: 'USD',
      confidence: 'low',
      assetType: 'stock'
    };
  }

  private async fetchCryptoPrice(symbol: string): Promise<PriceDetectionResult> {
    try {
      const coinId = this.getCoinGeckoId(symbol);
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
      const data = await response.json();
      if (data[coinId]?.usd) {
        return {
          symbol,
          supportsAutoPricing: true,
          source: 'coingecko',
          currentPrice: data[coinId].usd,
          currency: 'USD',
          confidence: 'high',
          companyName: this.getCryptoDisplayName(symbol),
          assetType: 'crypto'
        };
      }
    } catch (error) {
      console.error('CoinGecko detection failed:', error);
    }
    return {
      symbol,
      supportsAutoPricing: false,
      source: 'manual',
      currency: 'USD',
      confidence: 'low',
      assetType: 'crypto'
    };
  }

  private async detectBasicPricing(symbol: string): Promise<PriceDetectionResult> {
    // Try FMP first for stocks
    if (symbol.match(/^[A-Z]{1,5}$/)) {
      try {
        const response = await fetch(`${this.FMP_BASE_URL}/quote/${symbol}?apikey=${this.FMP_API_KEY}`);
        const data = await response.json();
        if (data && data[0] && data[0].price) {
          return {
            symbol,
            supportsAutoPricing: true,
            source: 'fmp',
            currentPrice: data[0].price,
            currency: 'USD',
            confidence: 'high',
            assetType: 'stock'
          };
        }
      } catch (error) {
        console.error('FMP detection failed:', error);
      }
    }
    // Try CoinGecko for crypto
    if (symbol.match(/^(BTC|ETH|ADA|DOT|SOL|AVAX|MATIC|LINK|UNI|AAVE)$/i)) {
      try {
        const coinId = this.getCoinGeckoId(symbol);
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        const data = await response.json();
        if (data[coinId]?.usd) {
          return {
            symbol,
            supportsAutoPricing: true,
            source: 'coingecko',
            currentPrice: data[coinId].usd,
            currency: 'USD',
            confidence: 'high',
            companyName: this.getCryptoDisplayName(symbol),
            assetType: 'crypto'
          };
        }
      } catch (error) {
        console.error('CoinGecko detection failed:', error);
      }
    }
    // Fallback to manual
    return {
      symbol,
      supportsAutoPricing: false,
      source: 'manual',
      currency: 'USD',
      confidence: 'low',
      assetType: 'manual'
    };
  }

  private async enhanceWithCompanyData(symbol: string, baseResult: PriceDetectionResult): Promise<PriceDetectionResult> {
    let companyName: string | undefined = baseResult.companyName;
    let industry: string | undefined = baseResult.industry;
    let existingHoldings: any[] = [];
    // Get company name from FMP if it's a stock
    if (baseResult.source === 'fmp' && !companyName) {
      try {
        const profileResponse = await fetch(`${this.FMP_BASE_URL}/profile/${symbol}?apikey=${this.FMP_API_KEY}`);
        const profileData = await profileResponse.json();
        if (profileData && profileData[0]) {
          companyName = profileData[0].companyName;
          industry = profileData[0].industry;
        }
      } catch (error) {
        console.error('Company profile fetch failed:', error);
      }
    }
    // Get existing holdings for this symbol
    try {
      const baseUrl = config.BASE_URL;
      const holdingsResponse = await fetch(`${baseUrl}/api/holdings`);
      if (holdingsResponse.ok) {
        const holdings = await holdingsResponse.json();
        existingHoldings = holdings
          .filter((h: any) => h.symbol.toUpperCase() === symbol.toUpperCase())
          .map((h: any) => ({
            id: h.id,
            name: h.name,
            location: h.location,
            valueUSD: h.valueUSD || 0
          }));
      }
    } catch (error) {
      console.error('Existing holdings fetch failed:', error);
    }
    return {
      ...baseResult,
      companyName,
      industry,
      existingHoldings: existingHoldings.length > 0 ? existingHoldings : undefined
    };
  }

  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'SOL': 'solana',
      'AVAX': 'avalanche-2',
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave'
    };
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private getCryptoDisplayName(symbol: string): string {
    const cryptoNames: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'WBTC': 'Wrapped Bitcoin',
      'USDC': 'USD Coin',
      'DOGE': 'Dogecoin',
      'ADA': 'Cardano',
      // Add more as needed...
    };
    return cryptoNames[symbol.toUpperCase()] || symbol.toUpperCase();
  }
}
