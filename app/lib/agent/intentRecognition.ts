// app/lib/agent/intentRecognition.ts
import { IntentResult, IntentType, ExtractedHoldingData, ExtractedYearlyData } from './types';

// Company name to symbol mapping
const COMPANY_SYMBOLS: Record<string, string> = {
  'apple': 'AAPL',
  'microsoft': 'MSFT',
  'google': 'GOOGL',
  'alphabet': 'GOOGL',
  'amazon': 'AMZN',
  'tesla': 'TSLA',
  'nvidia': 'NVDA',
  'meta': 'META',
  'facebook': 'META',
  'netflix': 'NFLX',
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'etf': 'VUAA',
  'vanguard': 'VUAA',
  'india': 'INDIA'
};

const normalizeSymbol = (symbol: string): string => {
  const normalized = symbol.toLowerCase();
  return COMPANY_SYMBOLS[normalized] || symbol.toUpperCase();
};

interface IntentPattern {
  intent: IntentType;
  patterns: RegExp[];
  entityExtractors: ((match: RegExpMatchArray) => Record<string, any>)[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Add Holding Patterns
  {
    intent: 'add_holding',
    patterns: [
      /add\s+(\d+)\s+shares?\s+of\s+(\w+)/i,
      /bought\s+(\d+)\s+(\w+)\s+at\s+\$?(\d+(?:\.\d+)?)/i,
      /purchased\s+(\w+)\s+(\d+)\s+shares?\s+at\s+\$?(\d+(?:\.\d+)?)/i,
      /add\s+(\w+)\s+(\d+)\s+shares?\s+for\s+\$?(\d+(?:\.\d+)?)/i,
      /bought\s+(\w+)\s+at\s+\$?(\d+(?:\.\d+)?)/i,
      /add\s+(\w+)\s+to\s+(core|growth|hedge|liquidity)/i,
      /add\s+(\d+)\s+shares?\s+of\s+(\w+)\s+at\s+\$?(\d+(?:\.\d+)?)/i,
      /bought\s+(\d+)\s+shares?\s+of\s+(\w+)\s+at\s+\$?(\d+(?:\.\d+)?)/i,
      /purchased\s+(\d+)\s+shares?\s+of\s+(\w+)\s+at\s+\$?(\d+(?:\.\d+)?)/i
    ],
    entityExtractors: [
      (match) => ({ quantity: parseInt(match[1]), symbol: normalizeSymbol(match[2]) }),
      (match) => ({ quantity: parseInt(match[1]), symbol: normalizeSymbol(match[2]), unitPrice: parseFloat(match[3]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), quantity: parseInt(match[2]), unitPrice: parseFloat(match[3]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), quantity: parseInt(match[2]), unitPrice: parseFloat(match[3]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), unitPrice: parseFloat(match[2]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), category: match[2] }),
      (match) => ({ quantity: parseInt(match[1]), symbol: normalizeSymbol(match[2]), unitPrice: parseFloat(match[3]) }),
      (match) => ({ quantity: parseInt(match[1]), symbol: normalizeSymbol(match[2]), unitPrice: parseFloat(match[3]) }),
      (match) => ({ quantity: parseInt(match[1]), symbol: normalizeSymbol(match[2]), unitPrice: parseFloat(match[3]) })
    ]
  },
  
  // Edit Holding Patterns
  {
    intent: 'edit_holding',
    patterns: [
      /update\s+(\w+)\s+price\s+to\s+\$?(\d+(?:\.\d+)?)/i,
      /change\s+(\w+)\s+quantity\s+to\s+(\d+)/i,
      /edit\s+(\w+)\s+holding/i,
      /modify\s+(\w+)\s+to\s+(\d+)\s+shares/i,
      /rename\s+(\w+)\s+to\s+(\w+)/i,
      /move\s+(\w+)\s+to\s+(core|growth|hedge|liquidity)/i,
      /change\s+(\w+)\s+category\s+to\s+(core|growth|hedge|liquidity)/i,
      /set\s+(\w+)\s+(?:buy\s+)?price\s+to\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /set\s+(\w+)\s+current\s+price\s+to\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /set\s+(\w+)\s+quantity\s+to\s+(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /change\s+(\w+)\s+location\s+to\s+(.+)/i,
      /enable\s+manual\s+pricing\s+for\s+(\w+)/i,
      /disable\s+auto\s+pricing\s+for\s+(\w+)/i,
    ],
    entityExtractors: [
      (match) => ({ symbol: normalizeSymbol(match[1]), unitPrice: parseFloat(match[2]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), quantity: parseInt(match[2]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), quantity: parseInt(match[2]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), newSymbol: normalizeSymbol(match[2]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), category: match[2].charAt(0).toUpperCase() + match[2].slice(1) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), category: match[2].charAt(0).toUpperCase() + match[2].slice(1) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), unitPrice: parseFloat(match[2].replace(/,/g, '')) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), currentUnitPrice: parseFloat(match[2].replace(/,/g, '')) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), quantity: parseFloat(match[2].replace(/,/g, '')) }),
      (match) => ({ symbol: normalizeSymbol(match[1]), location: match[2].trim() }),
      (match) => ({ symbol: normalizeSymbol(match[1]), manualPricing: true }),
      (match) => ({ symbol: normalizeSymbol(match[1]), manualPricing: false }),
    ]
  },
  
  // Delete Holding Patterns
  {
    intent: 'delete_holding',
    patterns: [
      /delete\s+(\w+)/i,
      /remove\s+(\w+)\s+holding/i,
      /sell\s+(\w+)/i,
      /exit\s+(\w+)\s+position/i
    ],
    entityExtractors: [
      (match) => ({ symbol: normalizeSymbol(match[1]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]) }),
      (match) => ({ symbol: normalizeSymbol(match[1]) })
    ]
  },
  
  // Add Yearly Data Patterns
  {
    intent: 'add_yearly_data',
    patterns: [
      /(\d{4})\s+(income|earned|made)\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d{4})\s+(income|earned|made)\s+was\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d{4})\s+expenses?\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d{4})\s+expenses?\s+were\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d{4})\s+net\s+worth\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d{4})\s+net\s+worth\s+was\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d{4})\s+savings?\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d{4})\s+savings?\s+were\s+\$?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(\d{4})\s+was\s+(good|bad)\s+year/i
    ],
    entityExtractors: [
      (match) => ({ year: parseInt(match[1]), income: parseFloat(match[3].replace(/,/g, '')) }),
      (match) => ({ year: parseInt(match[1]), income: parseFloat(match[3].replace(/,/g, '')) }),
      (match) => ({ year: parseInt(match[1]), expenses: parseFloat(match[2].replace(/,/g, '')) }),
      (match) => ({ year: parseInt(match[1]), expenses: parseFloat(match[2].replace(/,/g, '')) }),
      (match) => ({ year: parseInt(match[1]), netWorth: parseFloat(match[2].replace(/,/g, '')) }),
      (match) => ({ year: parseInt(match[1]), netWorth: parseFloat(match[2].replace(/,/g, '')) }),
      (match) => ({ year: parseInt(match[1]), savings: parseFloat(match[2].replace(/,/g, '')) }),
      (match) => ({ year: parseInt(match[1]), savings: parseFloat(match[2].replace(/,/g, '')) }),
      (match) => ({ year: parseInt(match[1]) })
    ]
  },
  
  // Portfolio Analysis Patterns
  {
    intent: 'portfolio_analysis',
    patterns: [
      /how\s+am\s+i\s+doing/i,
      /portfolio\s+performance/i,
      /analyze\s+portfolio/i,
      /portfolio\s+health/i,
      /allocation\s+review/i
    ],
    entityExtractors: [
      () => ({}),
      () => ({}),
      () => ({}),
      () => ({}),
      () => ({})
    ]
  }
];

export class IntentRecognition {
  static recognizeIntent(message: string): IntentResult {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Try each pattern
    for (const pattern of INTENT_PATTERNS) {
      for (let i = 0; i < pattern.patterns.length; i++) {
        const regex = pattern.patterns[i];
        const match = normalizedMessage.match(regex);
        
        if (match) {
          const entities = pattern.entityExtractors[i](match);
          const confidence = this.calculateConfidence(match, normalizedMessage);
          
          return {
            intent: pattern.intent,
            confidence,
            entities
          };
        }
      }
    }
    
    // No pattern matched
    return {
      intent: 'unknown',
      confidence: 0,
      entities: {}
    };
  }
  
  private static calculateConfidence(match: RegExpMatchArray, message: string): number {
    // Base confidence on how much of the message was matched
    const matchedLength = match[0].length;
    const totalLength = message.length;
    const coverage = matchedLength / totalLength;
    
    // Higher confidence for longer matches
    if (coverage > 0.8) return 0.95;
    if (coverage > 0.6) return 0.85;
    if (coverage > 0.4) return 0.75;
    return 0.6;
  }
  
  static extractHoldingData(message: string): ExtractedHoldingData {
    const intent = this.recognizeIntent(message);
    
    if (intent.intent === 'add_holding' || intent.intent === 'edit_holding') {
      return {
        symbol: intent.entities.symbol,
        quantity: intent.entities.quantity,
        unitPrice: intent.entities.unitPrice,
        category: intent.entities.category,
        currency: intent.entities.currency || 'SGD'
      };
    }
    
    return {};
  }
  
  static extractYearlyData(message: string): ExtractedYearlyData {
    const intent = this.recognizeIntent(message);
    
    if (intent.intent === 'add_yearly_data') {
      return {
        year: intent.entities.year,
        income: intent.entities.income,
        expenses: intent.entities.expenses,
        netWorth: intent.entities.netWorth,
        savings: intent.entities.savings
      };
    }
    
    return {};
  }
} 