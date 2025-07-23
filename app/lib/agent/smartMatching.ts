// app/lib/agent/smartMatching.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HoldingMatch {
  id: string;
  symbol: string;
  name: string;
  confidence: number;
  matchType: 'exact_symbol' | 'similar_symbol' | 'similar_name' | 'new_holding';
}

export interface SmartMatchResult {
  matches: HoldingMatch[];
  bestMatch: HoldingMatch | null;
  isNewHolding: boolean;
  suggestedAction: 'add_to_existing' | 'create_new' | 'clarify';
}

export class SmartHoldingMatcher {
  static async findMatches(symbol: string, existingHoldings: any[]): Promise<SmartMatchResult> {
    const normalizedSymbol = symbol.toUpperCase().trim();
    
    // 1. Exact symbol match
    const exactSymbolMatch = existingHoldings.find(h => 
      h.symbol.toUpperCase() === normalizedSymbol
    );
    
    if (exactSymbolMatch) {
      return {
        matches: [{
          id: exactSymbolMatch.id,
          symbol: exactSymbolMatch.symbol,
          name: exactSymbolMatch.name,
          confidence: 1.0,
          matchType: 'exact_symbol'
        }],
        bestMatch: {
          id: exactSymbolMatch.id,
          symbol: exactSymbolMatch.symbol,
          name: exactSymbolMatch.name,
          confidence: 1.0,
          matchType: 'exact_symbol'
        },
        isNewHolding: false,
        suggestedAction: 'add_to_existing'
      };
    }
    
    // 2. Similar symbol matches (fuzzy matching)
    const similarSymbolMatches = existingHoldings
      .filter(h => this.calculateSymbolSimilarity(normalizedSymbol, h.symbol.toUpperCase()) > 0.7)
      .map(h => ({
        id: h.id,
        symbol: h.symbol,
        name: h.name,
        confidence: this.calculateSymbolSimilarity(normalizedSymbol, h.symbol.toUpperCase()),
        matchType: 'similar_symbol' as const
      }))
      .sort((a, b) => b.confidence - a.confidence);
    
    // 3. Similar name matches (for cases like "Circle Internet Group" vs "Circle Internet Financial")
    const similarNameMatches = existingHoldings
      .filter(h => this.calculateNameSimilarity(normalizedSymbol, h.name) > 0.6)
      .map(h => ({
        id: h.id,
        symbol: h.symbol,
        name: h.name,
        confidence: this.calculateNameSimilarity(normalizedSymbol, h.name),
        matchType: 'similar_name' as const
      }))
      .sort((a, b) => b.confidence - a.confidence);
    
    // Combine and deduplicate matches
    const allMatches = [...similarSymbolMatches, ...similarNameMatches]
      .filter((match, index, arr) => 
        arr.findIndex(m => m.id === match.id) === index
      )
      .sort((a, b) => b.confidence - a.confidence);
    
    const bestMatch = allMatches[0];
    
    if (bestMatch && bestMatch.confidence > 0.8) {
      return {
        matches: allMatches,
        bestMatch,
        isNewHolding: false,
        suggestedAction: 'add_to_existing'
      };
    } else if (bestMatch && bestMatch.confidence > 0.6) {
      return {
        matches: allMatches,
        bestMatch,
        isNewHolding: false,
        suggestedAction: 'clarify'
      };
    } else {
      return {
        matches: [],
        bestMatch: null,
        isNewHolding: true,
        suggestedAction: 'create_new'
      };
    }
  }
  
  private static calculateSymbolSimilarity(symbol1: string, symbol2: string): number {
    if (symbol1 === symbol2) return 1.0;
    
    // Simple similarity based on common characters
    const set1 = new Set(symbol1.split(''));
    const set2 = new Set(symbol2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
  
  private static calculateNameSimilarity(symbol: string, companyName: string): number {
    const normalizedName = companyName.toLowerCase();
    const normalizedSymbol = symbol.toLowerCase();
    
    // Check if symbol appears in company name
    if (normalizedName.includes(normalizedSymbol)) {
      return 0.8;
    }
    
    // Check for common words (like "Circle", "Internet", "Group", "Financial")
    const nameWords = normalizedName.split(/\s+/);
    const symbolWords = normalizedSymbol.split(/\s+/);
    
    const commonWords = nameWords.filter(word => 
      symbolWords.some(symbolWord => 
        word.includes(symbolWord) || symbolWord.includes(word)
      )
    );
    
    if (commonWords.length > 0) {
      return Math.min(0.7, commonWords.length * 0.2);
    }
    
    return 0.0;
  }
  
  static async getCompanyInfo(symbol: string): Promise<{ name: string; description?: string } | null> {
    try {
      // For now, return a basic mapping - in Phase 2, this will call FMP API
      const companyMappings: Record<string, { name: string; description?: string }> = {
        'CRCL': { name: 'Circle Internet Financial Inc', description: 'Digital currency and financial services company' },
        'AAPL': { name: 'Apple Inc', description: 'Technology company specializing in consumer electronics' },
        'MSFT': { name: 'Microsoft Corporation', description: 'Technology company focused on software and cloud services' },
        'GOOGL': { name: 'Alphabet Inc', description: 'Technology conglomerate and parent company of Google' },
        'TSLA': { name: 'Tesla Inc', description: 'Electric vehicle and clean energy company' },
        'NVDA': { name: 'NVIDIA Corporation', description: 'Graphics processing and AI technology company' }
      };
      
      return companyMappings[symbol.toUpperCase()] || null;
    } catch (error) {
      console.error('Error fetching company info:', error);
      return null;
    }
  }
} 