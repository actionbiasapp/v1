// app/lib/agent/llmService.ts
import OpenAI from 'openai';
import { RichContext } from './contextProvider';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface LLMResponse {
  action: 'confirm' | 'clarify' | 'execute' | 'error';
  intent: string;
  entities: Record<string, any>;
  message: string;
  confidence: number;
  requires_confirmation: boolean;
  suggestions?: string[];
  learning_data?: {
    pattern: string;
    success_indicators: string[];
  };
}

export class LLMService {
  static async processMessage(message: string, context: RichContext): Promise<LLMResponse> {
    try {
      const prompt = this.buildPrompt(message, context);
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response with fallback strategies
      let result;
      
      // Strategy 1: Try direct parsing
      try {
        result = JSON.parse(content);
      } catch (parseError1) {
        // Strategy 2: Try to extract and clean JSON using regex
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = jsonMatch[0];
            // Clean the extracted JSON by removing problematic characters
            const cleanedJson = extractedJson
              .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
              .replace(/\n/g, ' ') // Replace newlines with spaces
              .replace(/\r/g, ' ') // Replace carriage returns with spaces
              .replace(/\t/g, ' ') // Replace tabs with spaces
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
            result = JSON.parse(cleanedJson);
          } else {
            throw new Error('No JSON object found in response');
          }
        } catch (parseError2) {
          console.error('All JSON parsing strategies failed for LLM response');
          console.error('Original content:', content);
          throw new Error('Invalid JSON response from LLM');
        }
      }

      return {
        action: result.action || 'clarify',
        intent: result.intent || 'unknown',
        entities: result.entities || {},
        message: result.message || 'I need more information to help you.',
        confidence: result.confidence || 0.5,
        requires_confirmation: result.requires_confirmation || false,
        suggestions: result.suggestions || [],
        learning_data: result.learning_data
      };
    } catch (error) {
      console.error('LLM processing error:', error);
      return {
        action: 'error',
        intent: 'unknown',
        entities: {},
        message: 'Sorry, I encountered an error. Please try rephrasing your request.',
        confidence: 0,
        requires_confirmation: false
      };
    }
  }

  private static buildPrompt(message: string, context: RichContext): string {
    const contextString = this.formatContext(context);
    
    return `You are a financial portfolio assistant. The user wants to: "${message}"

${contextString}

TASK:
1. Determine what the user wants to do
2. Identify the specific operation needed
3. Extract relevant entities (symbols, quantities, prices, etc.)
4. Handle any ambiguity intelligently

IMPORTANT: For operations that modify existing holdings (edit, delete, reduce, increase), if a matched holding is provided in the context, you MUST use that holding's symbol. For add_holding operations, proceed even if no holding is found.

AVAILABLE OPERATIONS:
- edit_holding: Modify existing holdings (rename, change price, quantity, category, location)
- delete_holding: Remove holdings from portfolio
- add_holding: Add new holdings to portfolio
- reduce_holding: Sell/reduce quantity of existing holdings
- increase_holding: Buy more of existing holdings
- add_yearly_data: Add financial data for a specific year
- portfolio_analysis: Analyze portfolio performance and allocation

RENAME OPERATIONS:
When user says "rename X to Y", intelligently determine what they want to rename:

SYMBOL RENAME (newSymbol):
- Y is short (2-5 characters) and uppercase: "DBS", "IBKR", "USDC-Ledger"
- Y looks like a ticker symbol: "AAPL", "GOOG", "TSLA"
- User explicitly says "rename symbol" or "rename ticker"

NAME RENAME (name):
- Y is longer and descriptive: "Cash", "Bitcoin", "Gold ETF"
- Y looks like a company name: "Apple Inc", "Google", "Tesla Inc"
- User explicitly says "rename name" or "rename company"

LOCATION RENAME (location):
- Y is a bank/broker name: "Standard Chartered", "DBS Bank", "Interactive Brokers"
- User explicitly says "rename location" or "rename broker"

SMART DETECTION:
- If Y matches the current holding's location, assume symbol rename unless user specifies otherwise
- If Y is a common bank name but user is renaming a symbol, prefer symbol rename
- When in doubt, ask for clarification with specific options

CLARIFICATION TRIGGERS:
- If Y could reasonably be interpreted as multiple types (symbol, name, or location), use clarification
- If Y is a short uppercase string that could be a symbol OR a location, ask for clarification
- If Y is a bank name that could be a location OR a company name, ask for clarification

CLARIFICATION FORMAT:
When ambiguous, respond with:
{
  "action": "clarify",
  "intent": "edit_holding",
  "entities": {"symbol": "X", "newValue": "Y"},
  "message": "I found your holding X. What would you like to rename?",
  "confidence": 0.8,
  "requires_confirmation": false,
  "suggestions": [
    "Rename symbol to Y",
    "Rename company name to Y", 
    "Rename location to Y"
  ]
}

IMPORTANT: When user mentions "Standard Chartered", they likely mean:
- The company name if they want to rename the display name
- The location if they want to change where the holding is stored
- The symbol if they want to change the ticker

CRITICAL: If a matched holding is provided in context, use that holding's symbol. Do not search for other holdings.

CONFIRMATION RULES:
- For ALL destructive operations (sell, reduce, delete), use action: "confirm" with requires_confirmation: true
- For clear rename operations, use action: "confirm" with requires_confirmation: true
- For ambiguous rename operations, use action: "clarify" with specific options
- When user says "rename X to Y" and Y could be multiple types, provide options:
  * "Rename symbol to Y"
  * "Rename company name to Y" 
  * "Rename location to Y"
- Examples of clear: "rename SCB to SCBC" (obviously symbol)
- Examples of ambiguous: "rename SCB to DBS" (could be symbol or location)
- Examples requiring confirmation: "sell half my HIMS", "reduce AAPL by 10 shares", "delete BTC"

EXAMPLES:
- "rename SCB to Cash" → edit_holding with name: "Cash" (company name)
- "rename SCB to SCBC" → edit_holding with newSymbol: "SCBC" (symbol)
- "rename SCB to DBS" → edit_holding with newSymbol: "DBS" (symbol - short uppercase)
- "rename SGD-CASH-3 to DBS" → edit_holding with newSymbol: "DBS" (symbol - short uppercase)
- "rename USDC-2 to USDC-Ledger" → edit_holding with newSymbol: "USDC-Ledger" (symbol)
- "rename Standard Chartered to Cash" → edit_holding with name: "Cash" (company name)
- "rename SCB location to DBS Bank" → edit_holding with location: "DBS Bank" (location)
- "sell half my HIMS" → reduce_holding with symbol: "HIMS", quantity: "half" (requires confirmation)
- "reduce AAPL by 10 shares" → reduce_holding with symbol: "AAPL", quantity: 10 (requires confirmation)
- "delete BTC" → delete_holding with symbol: "BTC" (requires confirmation)
- "add 100 shares of META at $300" → add_holding with symbol: "META", quantity: 100, unitPrice: 300 (requires confirmation)
- "buy 50 AAPL at $150" → add_holding with symbol: "AAPL", quantity: 50, unitPrice: 150 (requires confirmation)

RESPONSE FORMAT:
{
  "action": "confirm|clarify|execute|error",
  "intent": "the_operation_name",
  "entities": {
    // Dynamic based on operation
  },
  "message": "Human readable description",
  "confidence": 0.95,
  "requires_confirmation": true/false,
  "suggestions": ["suggestion1", "suggestion2"],
  "learning_data": {
    "pattern": "extracted_pattern",
    "success_indicators": ["what_would_indicate_success"]
  }
}

ACTION GUIDELINES:
- Use "confirm" when you're confident about the operation and have all required entities
- Use "clarify" when you need more information or are uncertain
- Use "execute" for immediate execution (rare, usually use "confirm")
- Use "error" when the request cannot be processed

For rename operations, always use "confirm" with requires_confirmation: true to let users review changes.

Be smart about ambiguity. If you're confident, proceed. If uncertain, ask for clarification.

Available operations: ${context.availableOperations.join(', ')}

Return JSON only.`;
  }

  private static formatContext(context: RichContext): string {
    const holdingsList = context.allHoldings.map(h => 
      `${h.symbol} (${h.name}) - ${h.quantity || 0} shares`
    ).join(', ');
    
    const recentActionsList = context.recentActions.map(a => 
      `${a.userInput} → ${a.actionTaken} (${a.success ? 'success' : 'failed'})`
    ).join(', ');
    
    const patternsList = context.userPatterns.map(p => 
      `${p.pattern} (${Math.round(p.successRate * 100)}% success, ${p.usageCount} uses)`
    ).join(', ');

    console.log('🔍 LLM Context:');
    console.log('- User Input:', context.userInput);
    console.log('- User Selection:', context.userSelection);
    console.log('- Matched Holding:', context.matchedHolding ? `${context.matchedHolding.symbol} (${context.matchedHolding.name})` : 'None');
    console.log('- All Holdings Count:', context.allHoldings.length);

    return `CONTEXT:
- User Input: "${context.userInput}"
${context.userSelection ? `- User Selection: "${context.userSelection}"` : ''}
${context.matchedHolding ? `- Matched Holding: ${context.matchedHolding.symbol} (${context.matchedHolding.name})` : ''}
- All Holdings: ${holdingsList || 'None'}
- Available Operations: ${context.availableOperations.join(', ')}
- Recent Actions: ${recentActionsList || 'None'}
- Successful Patterns: ${patternsList || 'None'}`;
  }
} 