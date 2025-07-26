// app/lib/agent/llmService.ts
import OpenAI from 'openai';
import { IntentResult, AgentContext, AgentResponse } from './types';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export class LLMService {
  static async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    try {
      const openaiClient = getOpenAIClient();
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a financial portfolio assistant. Extract structured data from user messages and respond with JSON only.

       Available actions:
       - add_holding: {symbol, quantity, unitPrice, currency, category}
       - reduce_holding: {symbol, quantity, unitPrice, currency}
       - increase_holding: {symbol, quantity, unitPrice, currency}
       - add_yearly_data: {year, income, expenses, netWorth, savings}
       - portfolio_analysis: {}
       - edit_holding: {symbol, quantity, unitPrice}
       - delete_holding: {symbol}

       Categories for holdings: Core, Growth, Hedge, Liquidity

       Current portfolio context:
       - Holdings: ${context.currentHoldings?.length || 0} items
       - Display currency: ${context.displayCurrency}
       - Yearly data: ${context.yearlyData?.length || 0} years

       IMPORTANT: When user mentions a company name or misspelled symbol, find the closest matching symbol in their portfolio. Use the actual portfolio symbol, not the user's input.
       
       Available symbols with quantities: ${context.currentHoldings?.map(h => `${h.symbol}(${h.quantity || 0})`).join(', ') || 'None'}
       
       When reducing by "half", calculate the exact number: current_quantity / 2

Return JSON only:
{
  "action": "confirm|clarify|analyze|error",
  "intent": "add_holding|add_yearly_data|portfolio_analysis|edit_holding|delete_holding|unknown",
  "entities": {...},
  "message": "Human readable confirmation or clarification",
  "confidence": 0.95,
  "requires_confirmation": true/false,
  "suggestions": ["suggestion1", "suggestion2"]
}

Examples:
       User: "Add 100 shares of [SYMBOL] at $150"
       Response: {"action":"confirm","intent":"add_holding","entities":{"symbol":"[SYMBOL]","quantity":100,"unitPrice":150,"currency":"USD","category":"Core"},"message":"I'll add 100 shares of [SYMBOL] at $150 USD to your portfolio.","confidence":0.95,"requires_confirmation":true}

       User: "add shares at $75"
       Response: {"action":"clarify","intent":"add_holding","entities":{"symbol":"","quantity":0,"unitPrice":75,"currency":"USD","category":"Core"},"message":"I need more information. What stock symbol and quantity? I'll assume USD unless you specify otherwise.","confidence":0.3,"suggestions":["Add 100 shares of [SYMBOL] at $75","Add 50 shares of [SYMBOL] at $75 SGD"]}

       User: "Reduce my [COMPANY] holdings by half. I sold it at $115"
       Response: {"action":"confirm","intent":"reduce_holding","entities":{"symbol":"[FOUND_SYMBOL]","quantity":"half","unitPrice":115,"currency":"USD","companyName":"[COMPANY]"},"message":"I found your [FOUND_SYMBOL] ([COMPANY]) holdings with [QUANTITY] shares. I'll reduce them by [CALCULATED_QUANTITY] shares (half) at $115 USD. Is this correct?","confidence":0.9,"requires_confirmation":true}

       User: "Sell 10 shares of [SYMBOL] at $150"
       Response: {"action":"confirm","intent":"reduce_holding","entities":{"symbol":"[SYMBOL]","quantity":10,"unitPrice":150,"currency":"USD"},"message":"I'll sell 10 shares of [SYMBOL] at $150 USD from your portfolio. Is this correct?","confidence":0.95,"requires_confirmation":true}

User: "2023 income was $120,000"
Response: {"action":"confirm","intent":"add_yearly_data","entities":{"year":2023,"income":120000},"message":"I'll add data for 2023: Income: $120,000","confidence":0.95,"requires_confirmation":true}

User: "Change the cost price of [COMPANY] to $130"
Response: {"action":"confirm","intent":"edit_holding","entities":{"symbol":"[FOUND_SYMBOL]","unitPrice":130},"message":"I'll update your [FOUND_SYMBOL] ([COMPANY]) holding buy price to $130. Is this correct?","confidence":0.95,"requires_confirmation":true}

User: "Update the current price of [COMPANY] to $130"
Response: {"action":"confirm","intent":"edit_holding","entities":{"symbol":"[FOUND_SYMBOL]","currentUnitPrice":130},"message":"I'll update your [FOUND_SYMBOL] ([COMPANY]) current market price to $130. Is this correct?","confidence":0.95,"requires_confirmation":true}`
          },
          { role: "user", content: message }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const result = JSON.parse(content);
      
      return {
        action: result.action || 'clarify',
        data: {
          intent: result.intent,
          entities: result.entities,
          confidence: result.confidence || 0.8
        },
        message: result.message || 'I understand your request.',
        confidence: result.confidence || 0.8,
        suggestions: result.suggestions || []
      };

    } catch (error) {
      console.error('LLM processing error:', error);
      
      // Fallback to regex patterns if LLM fails
      return {
        action: 'error',
        data: null,
        message: 'Sorry, I encountered an error. Please try rephrasing your request.',
        confidence: 0
      };
    }
  }

  static async processWithFallback(message: string, context: AgentContext): Promise<AgentResponse> {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not available, using fallback');
      const fallbackResult = this.simpleFallback(message);
      return {
        action: 'clarify',
        data: {
          intent: 'unknown',
          entities: {},
          confidence: 0.3
        },
        message: fallbackResult.message,
        confidence: 0.3,
        suggestions: fallbackResult.suggestions
      };
    }

    // Cost-saving: Use simple fallback for basic patterns to save tokens
    const lowerMessage = message.toLowerCase();
    
    // Quick pattern checks for common cases (saves API calls)
    if (lowerMessage.includes('test') || lowerMessage.length < 10) {
      const fallbackResult = this.simpleFallback(message);
      return {
        action: 'clarify',
        data: {
          intent: 'unknown',
          entities: {},
          confidence: 0.3
        },
        message: fallbackResult.message,
        confidence: 0.3,
        suggestions: fallbackResult.suggestions
      };
    }
    
    try {
      return await this.processMessage(message, context);
    } catch (error) {
      console.error('LLM fallback error:', error);
      
      // Ultimate fallback - simple pattern matching
      const fallbackResult = this.simpleFallback(message);
      return {
        action: 'clarify',
        data: {
          intent: 'unknown',
          entities: {},
          confidence: 0.3
        },
        message: fallbackResult.message,
        confidence: 0.3,
        suggestions: fallbackResult.suggestions
      };
    }
  }

  private static simpleFallback(message: string): { message: string; suggestions: string[] } {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('add') || lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      return {
        message: 'I understand you want to add something. Could you be more specific?',
        suggestions: [
          'Add 100 shares of [SYMBOL] at $150',
          'Add 50 shares of [SYMBOL] at $200'
        ]
      };
    }
    
    if (lowerMessage.includes('income') || lowerMessage.includes('earned') || lowerMessage.includes('made')) {
      return {
        message: 'I understand you want to add income data. Could you specify the year and amount?',
        suggestions: [
          '2023 income was $120,000',
          '2024 income is $150,000'
        ]
      };
    }
    
    if (lowerMessage.includes('portfolio') || lowerMessage.includes('performance')) {
      return {
        message: 'I can help you analyze your portfolio. What specific information would you like?',
        suggestions: [
          'How is my portfolio performing?',
          'Show my allocation breakdown'
        ]
      };
    }
    
    return {
      message: 'I didn\'t understand that. Try saying something like "Add 100 shares of [SYMBOL]" or "2023 income was $120k"',
      suggestions: [
        'Add 100 shares of [SYMBOL] at $150',
        '2023 income was $120,000',
        'How is my portfolio performing?'
      ]
    };
  }
} 