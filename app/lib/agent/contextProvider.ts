import { LearningService, UserPattern, ActionHistory } from './learningService';
import { Holding, YearlyData, FinancialProfile, createDefaultFinancialProfile } from '@/app/lib/types/shared';

export interface RichContext {
  userInput: string;
  userSelection?: string; // For confirmed intents
  matchedHolding?: Holding;
  allHoldings: Holding[];
  yearlyData: YearlyData[];
  financialProfile: FinancialProfile;
  recentActions: ActionHistory[];
  userPatterns: UserPattern[];
  availableOperations: string[];
}

export class ContextProvider {
  // Find holding based on user input
  static findHolding(userInput: string, holdings: Holding[]): Holding | undefined {
    const lowerInput = userInput.toLowerCase();
    console.log('🔍 Finding holding for input:', userInput);
    
    // Extract potential entities from the input
    const entities = this.extractEntities(lowerInput);
    console.log('🔍 Extracted entities:', entities);
    
    // For rename operations, prioritize exact symbol matching
    if (lowerInput.includes('rename')) {
      // First, try exact symbol match for rename operations (highest priority)
      for (const entity of entities) {
        const symbolMatch = holdings.find(holding => 
          holding.symbol.toLowerCase() === entity
        );
        if (symbolMatch) {
          console.log('✅ Found exact symbol match for rename:', symbolMatch.symbol);
          return symbolMatch;
        }
      }
      
      // Then try location match for rename operations
      for (const entity of entities) {
        const locationMatch = holdings.find(holding => 
          holding.location.toLowerCase().includes(entity) || 
          entity.includes(holding.location.toLowerCase())
        );
        if (locationMatch) {
          console.log('✅ Found location match for rename:', locationMatch.symbol, '(', locationMatch.location, ')');
          return locationMatch;
        }
      }
    }
    
    // First, try exact symbol match
    for (const entity of entities) {
      const symbolMatch = holdings.find(holding => 
        holding.symbol.toLowerCase() === entity
      );
      if (symbolMatch) {
        console.log('✅ Found exact symbol match:', symbolMatch.symbol);
        return symbolMatch;
      }
    }
    
    // Then, try company name match
    for (const entity of entities) {
      const nameMatch = holdings.find(holding => 
        holding.name.toLowerCase().includes(entity) || 
        entity.includes(holding.name.toLowerCase())
      );
      if (nameMatch) {
        console.log('✅ Found company name match:', nameMatch.symbol, '(', nameMatch.name, ')');
        return nameMatch;
      }
    }
    
    // Then, try partial symbol match
    for (const entity of entities) {
      const partialSymbolMatch = holdings.find(holding => 
        holding.symbol.toLowerCase().includes(entity) || 
        entity.includes(holding.symbol.toLowerCase())
      );
      if (partialSymbolMatch) {
        console.log('✅ Found partial symbol match:', partialSymbolMatch.symbol);
        return partialSymbolMatch;
      }
    }
    
    // Finally, try location match (but with lower priority for non-rename operations)
    for (const entity of entities) {
      const locationMatch = holdings.find(holding => 
        holding.location.toLowerCase().includes(entity) || 
        entity.includes(holding.location.toLowerCase())
      );
      if (locationMatch) {
        console.log('✅ Found location match:', locationMatch.symbol, '(', locationMatch.location, ')');
        return locationMatch;
      }
    }
    
    console.log('❌ No holding found for input:', userInput);
    return undefined;
  }

  // Extract potential entities from user input
  private static extractEntities(userInput: string): string[] {
    const entities: string[] = [];
    
    // Extract words that could be symbols, names, or locations
    const words = userInput.split(/\s+/);
    
    for (const word of words) {
      // Skip common words
      const skipWords = ['rename', 'to', 'as', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now', 'company', 'name', 'symbol', 'location'];
      
      if (!skipWords.includes(word.toLowerCase()) && word.length > 1) {
        entities.push(word);
      }
    }
    
    return entities;
  }

  // Get confirmation options for rename operations
  static getConfirmationOptions(holding: Holding, userInput: string) {
    // Extract potential new value from user input
    const newValue = this.extractNewValue(userInput);
    
    return {
      message: `I found your ${holding.symbol} (${holding.name}) holding. What would you like to rename?`,
      options: [
        `Rename symbol to ${newValue}`,
        `Rename company name to ${newValue}`,
        `Rename location to ${newValue}`
      ],
      matchedHolding: holding
    };
  }

  // Extract new value from user input (e.g., "Cash" from "rename to Cash")
  static extractNewValue(userInput: string): string {
    const lowerInput = userInput.toLowerCase();
    
    // Look for patterns like "to X", "as X", "rename X"
    const toMatch = userInput.match(/to\s+([a-zA-Z0-9\s]+)/i);
    if (toMatch) return toMatch[1].trim();
    
    const asMatch = userInput.match(/as\s+([a-zA-Z0-9\s]+)/i);
    if (asMatch) return asMatch[1].trim();
    
    // If no clear pattern, return a default
    return "New Name";
  }

  // Extract intent from user selection
  static extractIntent(userSelection: string): string {
    const lowerSelection = userSelection.toLowerCase();
    
    if (lowerSelection.includes('symbol')) return 'rename_symbol';
    if (lowerSelection.includes('company name')) return 'rename_company_name';
    if (lowerSelection.includes('location')) return 'rename_location';
    
    return 'unknown';
  }

  // Build rich context for OpenAI
  static async buildRichContext(
    userInput: string,
    userSelection?: string,
    holdings: Holding[] = [],
    yearlyData: YearlyData[] = [],
    financialProfile: FinancialProfile = createDefaultFinancialProfile()
  ): Promise<RichContext> {
    // Find matched holding - but if user made a selection, we should preserve the original holding
    let matchedHolding: Holding | undefined;
    
    if (userSelection) {
      // If user made a selection, try to find the holding from the original input
      // This prevents the system from finding a different holding when processing the selection
      matchedHolding = this.findHolding(userInput, holdings);
    } else {
      // Normal flow - find holding from current input
      matchedHolding = this.findHolding(userInput, holdings);
    }
    
    // Get learning data
    const userPatterns = await LearningService.getRelevantPatterns(userInput);
    const recentActions = await LearningService.getRecentActions(5);
    
    // Define available operations dynamically
    const availableOperations = [
      'add_holding',
      'edit_holding', 
      'delete_holding',
      'reduce_holding',
      'increase_holding',
      'add_yearly_data',
      'portfolio_analysis'
    ];

    return {
      userInput,
      userSelection,
      matchedHolding,
      allHoldings: holdings,
      yearlyData,
      financialProfile,
      recentActions,
      userPatterns,
      availableOperations
    };
  }

  // Format context for OpenAI prompt
  static formatContextForOpenAI(context: RichContext): string {
    const holdingsList = context.allHoldings.map(h => 
      `${h.symbol} (${h.name}) - ${h.quantity || 0} shares`
    ).join(', ');
    
    const recentActionsList = context.recentActions.map(a => 
      `${a.userInput} → ${a.actionTaken} (${a.success ? 'success' : 'failed'})`
    ).join(', ');
    
    const patternsList = context.userPatterns.map(p => 
      `${p.pattern} (${Math.round(p.successRate * 100)}% success, ${p.usageCount} uses)`
    ).join(', ');

    return `
CONTEXT:
- User Input: "${context.userInput}"
${context.userSelection ? `- User Selection: "${context.userSelection}"` : ''}
${context.matchedHolding ? `- Matched Holding: ${context.matchedHolding.symbol} (${context.matchedHolding.name})` : ''}
- All Holdings: ${holdingsList || 'None'}
- Available Operations: ${context.availableOperations.join(', ')}
- Recent Actions: ${recentActionsList || 'None'}
- Successful Patterns: ${patternsList || 'None'}
`;
  }
} 