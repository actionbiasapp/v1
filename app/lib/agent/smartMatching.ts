// app/lib/agent/smartMatching.ts - Enhanced Smart Holding Matching with FMP API Integration

import { lookupNewCompany, validateNewSymbol, type FMPQuote } from '@/app/lib/fmpApi';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  costBasis: number;
  valueSGD: number;
  valueUSD: number;
  valueINR: number;
  entryCurrency: string;
}

export interface MatchResult {
  symbol: string;
  name: string;
  confidence: number;
  id?: string;
}

export interface SmartMatchResult {
  suggestedAction: 'add_to_existing' | 'create_new' | 'clarify';
  bestMatch?: MatchResult;
  matches: MatchResult[];
  fmpData?: {
    symbol: string;
    name: string;
    price: number;
    exchange: string;
    currency: string;
    confidence: number;
  };
}

export class SmartHoldingMatcher {
  static async findMatches(
    symbol: string, 
    currentHoldings: Holding[]
  ): Promise<SmartMatchResult> {
    const normalizedSymbol = symbol.toUpperCase();
    
    // Step 1: Check for exact symbol matches
    const exactMatches = currentHoldings.filter(
      holding => holding.symbol.toUpperCase() === normalizedSymbol
    );
    
    if (exactMatches.length === 1) {
      return {
        suggestedAction: 'add_to_existing',
        bestMatch: {
          id: exactMatches[0].id,
          symbol: exactMatches[0].symbol,
          name: exactMatches[0].name,
          confidence: 1.0
        },
        matches: [{
          id: exactMatches[0].id,
          symbol: exactMatches[0].symbol,
          name: exactMatches[0].name,
          confidence: 1.0
        }]
      };
    }
    
    // Step 2: Check for similar symbol matches (fuzzy matching)
    const similarMatches = currentHoldings.filter(holding => {
      const holdingSymbol = holding.symbol.toUpperCase();
      return this.calculateSymbolSimilarity(normalizedSymbol, holdingSymbol) > 0.7;
    });
    
    if (similarMatches.length > 0) {
      const matches = similarMatches.map(holding => ({
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        confidence: this.calculateSymbolSimilarity(normalizedSymbol, holding.symbol.toUpperCase())
      })).sort((a, b) => b.confidence - a.confidence);
      
      if (matches.length === 1 && matches[0].confidence > 0.8) {
        return {
          suggestedAction: 'add_to_existing',
          bestMatch: matches[0],
          matches
        };
      }
      
      return {
        suggestedAction: 'clarify',
        matches
      };
    }
    
    // Step 3: Check for name similarity matches
    const nameMatches = currentHoldings.filter(holding => {
      const similarity = this.calculateNameSimilarity(symbol, holding.name);
      return similarity > 0.6;
    });
    
    if (nameMatches.length > 0) {
      const matches = nameMatches.map(holding => ({
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        confidence: this.calculateNameSimilarity(symbol, holding.name)
      })).sort((a, b) => b.confidence - a.confidence);
      
      if (matches.length === 1 && matches[0].confidence > 0.8) {
        return {
          suggestedAction: 'add_to_existing',
          bestMatch: matches[0],
          matches
        };
      }
      
      return {
        suggestedAction: 'clarify',
        matches
      };
    }
    
    // Step 4: If no matches found, try FMP API for new company lookup
    try {
      const fmpData = await lookupNewCompany(symbol);
      
      if (fmpData) {
        return {
          suggestedAction: 'create_new',
          matches: [],
          fmpData
        };
      }
    } catch (error) {
      console.error('FMP API lookup failed:', error);
    }
    
    // Step 5: Default to create new (even without FMP data)
    return {
      suggestedAction: 'create_new',
      matches: []
    };
  }
  
  private static calculateSymbolSimilarity(symbol1: string, symbol2: string): number {
    if (symbol1 === symbol2) return 1.0;
    
    // Handle common variations
    const variations = [
      { from: 'BTC', to: 'BITCOIN' },
      { from: 'ETH', to: 'ETHEREUM' },
      { from: 'USDC', to: 'USD COIN' },
      { from: 'WBTC', to: 'WRAPPED BITCOIN' }
    ];
    
    for (const variation of variations) {
      if (symbol1 === variation.from && symbol2.includes(variation.to)) return 0.9;
      if (symbol2 === variation.from && symbol1.includes(variation.to)) return 0.9;
    }
    
    // Simple string similarity
    const longer = symbol1.length > symbol2.length ? symbol1 : symbol2;
    const shorter = symbol1.length > symbol2.length ? symbol2 : symbol1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  private static calculateNameSimilarity(query: string, companyName: string): number {
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
      return 0.9;
    }
    
    // Check for word overlap
    const queryWords = normalizedQuery.split(/\s+/);
    const nameWords = normalizedName.split(/\s+/);
    
    const commonWords = queryWords.filter(word => 
      nameWords.some(nameWord => nameWord.includes(word) || word.includes(nameWord))
    );
    
    if (commonWords.length > 0) {
      return Math.min(0.8, commonWords.length / Math.max(queryWords.length, nameWords.length));
    }
    
    return 0;
  }
  
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // Enhanced method to validate new symbols with FMP API
  static async validateNewSymbol(symbol: string): Promise<{
    isValid: boolean;
    price?: number;
    name?: string;
    exchange?: string;
    confidence?: number;
  }> {
    try {
      const validation = await validateNewSymbol(symbol);
      
      if (validation.isValid) {
        return {
          isValid: true,
          price: validation.price,
          name: validation.name,
          exchange: validation.exchange,
          confidence: 0.95
        };
      }
      
      // Try company name lookup
      const fmpData = await lookupNewCompany(symbol);
      if (fmpData) {
        return {
          isValid: true,
          price: fmpData.price,
          name: fmpData.name,
          exchange: fmpData.exchange,
          confidence: fmpData.confidence
        };
      }
      
      return { isValid: false };
    } catch (error) {
      console.error('Symbol validation failed:', error);
      return { isValid: false };
    }
  }
} 