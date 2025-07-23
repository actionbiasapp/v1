// app/lib/fmpApi.ts - Financial Modeling Prep API Integration

export interface FMPCompanyProfile {
  symbol: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: number;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
}

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

export interface FMPSearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
}

class FMPApiClient {
  private apiKey: string;
  private baseUrl = 'https://financialmodelingprep.com/api/v3';

  constructor() {
    this.apiKey = process.env.FMP_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FMP API key not found. Company lookups will be limited.');
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = `${this.baseUrl}${endpoint}?apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`FMP API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('FMP API request failed:', error);
      return null;
    }
  }

  async searchCompany(query: string): Promise<FMPSearchResult[]> {
    const endpoint = `/search?query=${encodeURIComponent(query)}&limit=10`;
    const results = await this.makeRequest<FMPSearchResult[]>(endpoint);
    return results || [];
  }

  async getCompanyProfile(symbol: string): Promise<FMPCompanyProfile | null> {
    const endpoint = `/profile/${symbol}`;
    const results = await this.makeRequest<FMPCompanyProfile[]>(endpoint);
    return results && results.length > 0 ? results[0] : null;
  }

  async getQuote(symbol: string): Promise<FMPQuote | null> {
    const endpoint = `/quote/${symbol}`;
    const results = await this.makeRequest<FMPQuote[]>(endpoint);
    return results && results.length > 0 ? results[0] : null;
  }

  async getMultipleQuotes(symbols: string[]): Promise<FMPQuote[]> {
    if (symbols.length === 0) return [];
    
    const symbolsParam = symbols.join(',');
    const endpoint = `/quote/${symbolsParam}`;
    const results = await this.makeRequest<FMPQuote[]>(endpoint);
    return results || [];
  }

  // Enhanced company lookup with fallback
  async lookupCompany(symbolOrName: string): Promise<{
    symbol: string;
    name: string;
    price: number;
    exchange: string;
    currency: string;
    confidence: number;
  } | null> {
    try {
      // First try direct symbol lookup
      const quote = await this.getQuote(symbolOrName.toUpperCase());
      if (quote) {
        return {
          symbol: quote.symbol,
          name: quote.name,
          price: quote.price,
          exchange: quote.exchange,
          currency: 'USD', // FMP primarily deals with USD
          confidence: 0.95
        };
      }

      // If no direct match, search by name
      const searchResults = await this.searchCompany(symbolOrName);
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        const quoteForMatch = await this.getQuote(bestMatch.symbol);
        
        if (quoteForMatch) {
          return {
            symbol: bestMatch.symbol,
            name: bestMatch.name,
            price: quoteForMatch.price,
            exchange: bestMatch.exchangeShortName,
            currency: bestMatch.currency,
            confidence: 0.85
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Company lookup failed:', error);
      return null;
    }
  }

  // Validate if a symbol exists and get current price
  async validateSymbol(symbol: string): Promise<{
    isValid: boolean;
    price?: number;
    name?: string;
    exchange?: string;
  }> {
    try {
      const quote = await this.getQuote(symbol.toUpperCase());
      if (quote) {
        return {
          isValid: true,
          price: quote.price,
          name: quote.name,
          exchange: quote.exchange
        };
      }
      return { isValid: false };
    } catch (error) {
      console.error('Symbol validation failed:', error);
      return { isValid: false };
    }
  }
}

// Export singleton instance
export const fmpApi = new FMPApiClient();

// Helper functions for common use cases
export async function lookupNewCompany(symbolOrName: string) {
  return await fmpApi.lookupCompany(symbolOrName);
}

export async function validateNewSymbol(symbol: string) {
  return await fmpApi.validateSymbol(symbol);
}

export async function searchCompanies(query: string) {
  return await fmpApi.searchCompany(query);
} 