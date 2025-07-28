// app/lib/agent/agentService.ts
import { 
  AgentRequest, 
  AgentResponse, 
  AgentContext, 
  IntentResult,
  ValidationResult,
  AgentAction,
  ExtractedHoldingData,
  ExtractedYearlyData
} from './types';
import { LLMService, LLMResponse } from './llmService';
import { QuickQueryHandler } from './quickQueries';
import { DataValidator } from './validator';
import { SmartHoldingMatcher, SmartMatchResult } from './smartMatching';
import { ContextProvider, RichContext } from './contextProvider';
import { type CurrencyCode } from '@/app/lib/currency';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PortfolioAgent {
  static async processMessage(request: AgentRequest): Promise<AgentResponse> {
    try {
      const { message, context } = request;
      
      console.log('🔍 Processing message:', message);
      
      // First, try quick queries (no OpenAI cost)
      const quickResult = await QuickQueryHandler.handleQuery(
        message,
        context.currentHoldings || [],
        (context.displayCurrency as CurrencyCode) || 'SGD',
        null, // exchangeRates can be added later
        context.financialProfile
      );
      
      console.log('🔍 Quick query result:', quickResult);
      
      if (quickResult.success) {
        // Provide context-aware suggestions based on what was just shown
        const suggestions = this.getContextAwareSuggestions(quickResult.data?.type);
        
        return {
          action: 'confirm',
          data: quickResult.data,
          message: quickResult.message,
          confidence: 1.0,
          suggestions,
          requires_confirmation: false
        };
      }
      
      // Build rich context for LLM
      const richContext = await ContextProvider.buildRichContext(
        message,
        undefined, // userSelection
        context.currentHoldings || [],
        context.yearlyData || [],
        context.financialProfile
      );
      
      console.log('🔍 Rich context built, processing with LLM...');
      
      // Use LLM for intent recognition and data extraction
      let llmResponse: LLMResponse;
      try {
        llmResponse = await LLMService.processMessage(message, richContext);
        console.log('🔍 LLM response received:', llmResponse);
      } catch (error) {
        console.error('❌ LLM processing error:', error);
        return {
          action: 'error',
          data: { intent: 'error', entities: {} },
          message: 'Sorry, I encountered an error processing your request. Please try again.',
          confidence: 0,
          suggestions: ['Try rephrasing your request', 'Ask about your portfolio value', 'Show my holdings']
        };
      }
      
      // Convert LLMResponse to AgentResponse format
      const agentResponse: AgentResponse = {
        action: llmResponse.action as any,
        data: {
          intent: llmResponse.intent,
          entities: llmResponse.entities
        },
        message: llmResponse.message,
        confidence: llmResponse.confidence,
        suggestions: llmResponse.suggestions,
        requires_confirmation: llmResponse.requires_confirmation
      };
      
      // If LLM couldn't understand, return the clarification response
      if (llmResponse.action === 'clarify' || llmResponse.action === 'error') {
        return agentResponse;
      }
      
      // For confirmation actions, validate the extracted data
      if (llmResponse.action === 'confirm' && agentResponse.data) {
        const { intent, entities } = agentResponse.data;
        
        // Validate based on intent type
        let validation: ValidationResult;
        
        switch (intent) {
          case 'add_holding':
          case 'edit_holding':
          case 'delete_holding':
            validation = await DataValidator.validateHoldingData(entities, context);
            
            // For add_holding, perform smart matching
            if (intent === 'add_holding' && validation.isValid) {
              const matchResult = await SmartHoldingMatcher.findMatches(
                entities.symbol, 
                context.currentHoldings || []
              );
              
              // If we found a good match, suggest adding to existing holding
              if (matchResult.suggestedAction === 'add_to_existing' && matchResult.bestMatch) {
                return {
                  action: 'confirm',
                  data: {
                    intent: 'add_to_existing_holding',
                    entities: {
                      ...entities,
                      existingHoldingId: matchResult.bestMatch.id,
                      existingHoldingName: matchResult.bestMatch.name,
                      matchConfidence: matchResult.bestMatch.confidence
                    },
                    confidence: llmResponse.confidence
                  },
                  message: `I found an existing holding: ${matchResult.bestMatch.name} (${matchResult.bestMatch.symbol}). Would you like to add ${entities.quantity} shares at $${entities.unitPrice} to this existing position?`,
                  confidence: validation.confidence
                };
              }
              
              // If we need clarification, show options
              if (matchResult.suggestedAction === 'clarify' && matchResult.matches.length > 0) {
                const options = matchResult.matches.map(match => 
                  `${match.name} (${match.symbol}) - ${Math.round(match.confidence * 100)}% match`
                );
                
                return {
                  action: 'clarify',
                  data: {
                    intent: 'add_holding',
                    entities: entities,
                    matches: matchResult.matches
                  },
                  message: `I found similar holdings in your portfolio. Which one did you mean?\n\n${options.join('\n')}\n\nOr is this a new holding?`,
                  confidence: validation.confidence,
                  suggestions: [
                    ...options,
                    'This is a new holding'
                  ]
                };
              }
            }
            break;
            
          case 'add_yearly_data':
            validation = await DataValidator.validateYearlyData(entities, context);
            break;
            
          case 'portfolio_analysis':
            return this.generatePortfolioAnalysis(context);
            
          default:
            return agentResponse;
        }
        
        // If validation failed, return clarification
        if (!validation.isValid) {
          return {
            action: 'clarify',
            data: null,
            message: DataValidator.generateClarificationMessage(validation.errors, validation.warnings),
            confidence: validation.confidence,
            suggestions: validation.suggestions
          };
        }
      }
      
      // Return the agent response (either confirmation or analysis)
      return agentResponse;
      
    } catch (error) {
      console.error('Agent processing error:', error);
      return {
        action: 'error',
        data: null,
        message: 'Sorry, I encountered an error. Please try again.',
        confidence: 0
      };
    }
  }
  
  static async executeAction(action: AgentAction): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      switch (action.type) {
        case 'add_holding':
          return await this.executeAddHolding(action.data);
          
        case 'reduce_holding':
          return await this.executeReduceHolding(action.data);
          
        case 'increase_holding':
          return await this.executeIncreaseHolding(action.data);
          
        case 'add_to_existing_holding':
          return await this.executeAddToExistingHolding(action.data);
          
        case 'edit_holding':
          return await this.executeEditHolding(action.data);
          
        case 'delete_holding':
          return await this.executeDeleteHolding(action.data);
          
        case 'add_yearly_data':
          return await this.executeAddYearlyData(action.data);
          
        case 'portfolio_analysis':
          const analysis = this.generatePortfolioAnalysis(action.data);
          return { success: true, message: analysis.message, data: analysis.data };
          
        default:
          return { success: false, message: 'Action not implemented yet' };
      }
    } catch (error) {
      console.error('Action execution error:', error);
      return { success: false, message: 'Failed to execute action' };
    }
  }
  
  private static async executeAddHolding(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Calculate the total value based on quantity and unit price
      const totalValue = data.quantity && data.unitPrice ? data.quantity * data.unitPrice : 0;
      
      // Set values in the correct currency
      let valueSGD = 0;
      let valueUSD = 0;
      let valueINR = 0;
      
      if (data.currency === 'USD') {
        valueUSD = totalValue;
        valueSGD = totalValue * 1.35; // Approximate USD to SGD conversion
      } else if (data.currency === 'INR') {
        valueINR = totalValue;
        valueSGD = totalValue / 63.5; // Approximate INR to SGD conversion
      } else {
        // Default to SGD
        valueSGD = totalValue;
      }
      
      // Get or create user and category using shared utilities
      const user = await this.getOrCreateDefaultUser();
      const category = await this.getOrCreateCategory(data.category, user.id);
      
      // Check if holding already exists
      const existingHolding = await prisma.holdings.findFirst({
        where: {
          symbol: data.symbol,
          userId: user.id
        }
      });
      
      if (existingHolding) {
        return { 
          success: false, 
          message: `Holding ${data.symbol} already exists in your portfolio. Please edit the existing holding instead.` 
        };
      }
      
      // Generate a better company name
      const companyName = this.generateCompanyName(data.symbol);
      
      // Create the holding
      const holding = await prisma.holdings.create({
        data: {
          symbol: data.symbol,
          name: companyName,
          valueSGD: valueSGD,
          valueUSD: valueUSD,
          valueINR: valueINR,
          entryCurrency: data.currency || 'SGD',
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          currentUnitPrice: data.unitPrice, // Set current price to unit price initially
          categoryId: category.id,
          location: data.location || 'IBKR',
          userId: user.id,
          priceSource: 'manual',
          priceUpdated: new Date()
        }
      });
      
      return { 
        success: true, 
        message: `Successfully added ${data.quantity} shares of ${data.symbol} to your portfolio` 
      };
      
    } catch (error) {
      console.error('Add holding error:', error);
      return { success: false, message: 'Database error while adding holding' };
    }
  }
  
  private static async executeAddToExistingHolding(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { existingHoldingId, quantity, unitPrice } = data;

      const existingHolding = await prisma.holdings.findFirst({
        where: { id: existingHoldingId }
      });

      if (!existingHolding) {
        return { success: false, message: 'Existing holding not found' };
      }

      // Calculate the total value based on quantity and unit price
      const totalValue = quantity && unitPrice ? quantity * unitPrice : 0;
      
      // Set values in the correct currency
      let valueSGD = 0;
      let valueUSD = 0;
      let valueINR = 0;
      
      if (existingHolding.entryCurrency === 'USD') {
        valueUSD = totalValue;
        valueSGD = totalValue * 1.35; // Approximate USD to SGD conversion
      } else if (existingHolding.entryCurrency === 'INR') {
        valueINR = totalValue;
        valueSGD = totalValue / 63.5; // Approximate INR to SGD conversion
      } else {
        // Default to SGD
        valueSGD = totalValue;
      }

      // Update the existing holding
      await prisma.holdings.update({
        where: { id: existingHoldingId },
        data: {
          quantity: (Number(existingHolding.quantity) || 0) + quantity,
          valueSGD: (Number(existingHolding.valueSGD) || 0) + valueSGD,
          valueUSD: (Number(existingHolding.valueUSD) || 0) + valueUSD,
          valueINR: (Number(existingHolding.valueINR) || 0) + valueINR,
          currentUnitPrice: unitPrice, // Update current price
          priceUpdated: new Date()
        }
      });
      
      return { 
        success: true, 
        message: `Successfully added ${quantity} shares of ${existingHolding.symbol} to your portfolio` 
      };
      
    } catch (error) {
      console.error('Add to existing holding error:', error);
      return { success: false, message: 'Database error while adding to existing holding' };
    }
  }
  
  private static async executeEditHolding(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Get or create user using shared utility
      const user = await this.getOrCreateDefaultUser();

      // Find the existing holding by exact symbol
      const holding = await prisma.holdings.findFirst({
        where: {
          symbol: data.symbol
        }
      });

      if (!holding) {
        return { 
          success: false, 
          message: `No holding found with symbol ${data.symbol}. Please check the symbol and try again.` 
        };
      }

      // Update the holding with new values
      const updateData: any = {};
      
      // Handle symbol rename
      if (data.newSymbol && data.newSymbol !== data.symbol) {
        // Check if new symbol already exists
        const existingHolding = await prisma.holdings.findFirst({
          where: {
            symbol: data.newSymbol,
            id: { not: holding.id } // Exclude current holding
          }
        });
        
        if (existingHolding) {
          return { 
            success: false, 
            message: `Symbol ${data.newSymbol} already exists in your portfolio. Please use a different symbol.` 
          };
        }
        
        updateData.symbol = data.newSymbol;
      }
      
      // Handle company name updates
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      
      // Handle asset type updates
      if (data.assetType !== undefined) {
        updateData.assetType = data.assetType;
      }
      
      // Handle category updates
      if (data.category !== undefined) {
        // Validate category
        const validCategories = ['Core', 'Growth', 'Hedge', 'Liquidity'];
        if (!validCategories.includes(data.category)) {
          return { 
            success: false, 
            message: `Invalid category: ${data.category}. Valid categories are: ${validCategories.join(', ')}` 
          };
        }
        
        // Find category in database
        const category = await prisma.assetCategory.findFirst({
          where: { name: data.category }
        });
        
        if (!category) {
          return { 
            success: false, 
            message: `Category ${data.category} not found in database.` 
          };
        }
        
        updateData.categoryId = category.id;
      }
      
      // Handle location updates
      if (data.location !== undefined) {
        updateData.location = data.location;
      }
      
      // Handle buy price (unitPrice) updates
      if (data.unitPrice !== undefined) {
        updateData.unitPrice = data.unitPrice;
        // Recalculate values based on new unit price
        const quantity = Number(holding.quantity) || 0;
        updateData.valueUSD = quantity * data.unitPrice;
        updateData.valueSGD = quantity * data.unitPrice * 1.35; // Approximate SGD conversion
        updateData.valueINR = quantity * data.unitPrice * 83; // Approximate INR conversion
      }
      
      // Handle current market price updates
      if (data.currentUnitPrice !== undefined) {
        updateData.currentUnitPrice = data.currentUnitPrice;
        updateData.priceUpdated = new Date();
        updateData.priceSource = 'manual'; // Since user manually updated
        
        // Recalculate stored values to ensure consistency
        const quantity = Number(holding.quantity) || 0;
        const totalValue = quantity * data.currentUnitPrice;
        
        // Use proper currency conversion based on entry currency
        if (holding.entryCurrency === 'SGD') {
          updateData.valueSGD = totalValue;
          updateData.valueUSD = totalValue / 1.35;
          updateData.valueINR = totalValue * 83;
        } else if (holding.entryCurrency === 'USD') {
          updateData.valueUSD = totalValue;
          updateData.valueSGD = totalValue * 1.35;
          updateData.valueINR = totalValue * 83;
        } else if (holding.entryCurrency === 'INR') {
          updateData.valueINR = totalValue;
          updateData.valueSGD = totalValue / 83;
          updateData.valueUSD = totalValue / 83 / 1.35;
        }
      }
      
      // Handle quantity updates
      if (data.quantity !== undefined) {
        updateData.quantity = data.quantity;
        // Recalculate values based on new quantity
        const unitPrice = Number(holding.unitPrice) || 0;
        updateData.valueUSD = data.quantity * unitPrice;
        updateData.valueSGD = data.quantity * unitPrice * 1.35;
        updateData.valueINR = data.quantity * unitPrice * 83;
      }
      
      // Handle manual pricing toggle
      if (data.manualPricing !== undefined) {
        updateData._enableAutoPricing = !data.manualPricing;
      }

      await prisma.holdings.update({
        where: { id: holding.id },
        data: updateData
      });

      // Build success message
      let message = `Successfully updated ${data.newSymbol || holding.symbol}.`;
      if (data.newSymbol && data.newSymbol !== data.symbol) message += ` Renamed from ${data.symbol} to ${data.newSymbol}`;
      if (data.name !== undefined) message += ` New name: ${data.name}`;
      if (data.category !== undefined) message += ` New category: ${data.category}`;
      if (data.location !== undefined) message += ` New location: ${data.location}`;
      if (data.unitPrice !== undefined) message += ` New buy price: $${data.unitPrice}`;
      if (data.currentUnitPrice !== undefined) message += ` New current price: $${data.currentUnitPrice}`;
      if (data.quantity !== undefined) message += ` New quantity: ${data.quantity}`;
      if (data.manualPricing !== undefined) message += ` Manual pricing: ${data.manualPricing ? 'enabled' : 'disabled'}`;

      return { 
        success: true, 
        message: message.trim()
      };
    } catch (error) {
      console.error('Edit holding error:', error);
      return { success: false, message: 'Database error while editing holding' };
    }
  }
  
  private static async executeDeleteHolding(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Get or create user using shared utility
      const user = await this.getOrCreateDefaultUser();

      // Find the existing holding by exact symbol
      const holding = await prisma.holdings.findFirst({
        where: {
          symbol: data.symbol
        }
      });

      if (!holding) {
        return { 
          success: false, 
          message: `No holding found with symbol ${data.symbol}. Please check the symbol and try again.` 
        };
      }

      // Delete the holding
      await prisma.holdings.delete({
        where: { id: holding.id }
      });

      return { 
        success: true, 
        message: `Successfully deleted ${holding.symbol} (${holding.name}) from your portfolio` 
      };
      
    } catch (error) {
      console.error('Delete holding error:', error);
      return { success: false, message: 'Database error while deleting holding' };
    }
  }

  private static async executeReduceHolding(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Get or create user using shared utility
      const user = await this.getOrCreateDefaultUser();

      // Find the existing holding by exact symbol (LLM should have already found the correct one)
      const holding = await prisma.holdings.findFirst({
        where: {
          symbol: data.symbol
        }
      });

      if (!holding) {
        return { 
          success: false, 
          message: `No holding found with symbol ${data.symbol}. Please check the symbol and try again.` 
        };
      }

      const currentQuantity = Number(holding.quantity) || 0;
      let reduceQuantity = data.quantity;

      // Handle "half" reduction
      if (typeof data.quantity === 'string' && data.quantity.toLowerCase() === 'half') {
        reduceQuantity = Math.floor(currentQuantity / 2);
      } else if (typeof data.quantity === 'number') {
        reduceQuantity = data.quantity;
      } else {
        return { success: false, message: 'Invalid quantity specified for reduction' };
      }

      if (reduceQuantity > currentQuantity) {
        return { 
          success: false, 
          message: `Cannot reduce by ${reduceQuantity} shares. You only have ${currentQuantity} shares of ${holding.symbol}.` 
        };
      }

      const newQuantity = currentQuantity - reduceQuantity;
      const reductionValue = reduceQuantity * (data.unitPrice || Number(holding.unitPrice) || 0);

      // Update the holding
      if (newQuantity === 0) {
        // Delete the holding if quantity becomes 0
        await prisma.holdings.delete({
          where: { id: holding.id }
        });
        return { 
          success: true, 
          message: `Successfully sold all ${currentQuantity} shares of ${holding.symbol} at $${data.unitPrice || holding.unitPrice}` 
        };
      } else {
        // Update quantity and values
        await prisma.holdings.update({
          where: { id: holding.id },
          data: {
            quantity: newQuantity,
            valueSGD: (Number(holding.valueSGD) || 0) * (newQuantity / currentQuantity),
            valueUSD: (Number(holding.valueUSD) || 0) * (newQuantity / currentQuantity),
            valueINR: (Number(holding.valueINR) || 0) * (newQuantity / currentQuantity)
          }
        });
        return { 
          success: true, 
          message: `Successfully sold ${reduceQuantity} shares of ${holding.symbol} at $${data.unitPrice || holding.unitPrice}. ${newQuantity} shares remaining.` 
        };
      }
    } catch (error) {
      console.error('Reduce holding error:', error);
      return { success: false, message: 'Database error while reducing holding' };
    }
  }

  private static async executeIncreaseHolding(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Get or create user using shared utility
      const user = await this.getOrCreateDefaultUser();

      // Find the existing holding by exact symbol (LLM should have already found the correct one)
      const holding = await prisma.holdings.findFirst({
        where: {
          symbol: data.symbol
        }
      });

      if (!holding) {
        return { 
          success: false, 
          message: `No holding found with symbol ${data.symbol}. Please check the symbol and try again.` 
        };
      }

      const currentQuantity = Number(holding.quantity) || 0;
      const addQuantity = data.quantity;
      const newQuantity = currentQuantity + addQuantity;
      const additionValue = addQuantity * data.unitPrice;

      // Calculate new weighted average price
      const currentTotalValue = currentQuantity * (Number(holding.unitPrice) || 0);
      const newTotalValue = currentTotalValue + additionValue;
      const newAveragePrice = newTotalValue / newQuantity;

      // Update the holding
      await prisma.holdings.update({
        where: { id: holding.id },
        data: {
          quantity: newQuantity,
          unitPrice: newAveragePrice,
          valueSGD: (Number(holding.valueSGD) || 0) + (additionValue * (holding.entryCurrency === 'USD' ? 1.35 : 1)),
          valueUSD: (Number(holding.valueUSD) || 0) + (additionValue * (holding.entryCurrency === 'USD' ? 1 : 1/1.35)),
          valueINR: (Number(holding.valueINR) || 0) + (additionValue * (holding.entryCurrency === 'INR' ? 1 : 63.5))
        }
      });

      return { 
        success: true, 
        message: `Successfully added ${addQuantity} shares of ${holding.symbol} at $${data.unitPrice}. New average price: $${newAveragePrice.toFixed(2)}. Total shares: ${newQuantity}.` 
      };
    } catch (error) {
      console.error('Increase holding error:', error);
      return { success: false, message: 'Database error while increasing holding' };
    }
  }
  
  private static async executeAddYearlyData(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Get or create user (for testing - using default user)
      let user = await prisma.user.findFirst({
        where: { id: 'default-user' }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: 'default-user',
            email: 'default@example.com',
            name: 'Default User'
          }
        });
      }
      
      // Check if yearly data already exists for this year
      const existingData = await prisma.yearlyData.findFirst({
        where: {
          userId: user.id,
          year: data.year
        }
      });
      
      if (existingData) {
        // Update existing data
        await prisma.yearlyData.update({
          where: { id: existingData.id },
          data: {
            netWorth: data.netWorth || existingData.netWorth,
            income: data.income || existingData.income,
            expenses: data.expenses || existingData.expenses,
            savings: data.savings || existingData.savings,
            marketGains: data.marketGains || existingData.marketGains
          }
        });
      } else {
        // Create new data
        await prisma.yearlyData.create({
          data: {
            userId: user.id,
            year: data.year,
            netWorth: data.netWorth || 0,
            income: data.income || 0,
            expenses: data.expenses || 0,
            savings: data.savings || 0,
            marketGains: data.marketGains || 0
          }
        });
      }
      
      return { 
        success: true, 
        message: `Successfully added data for ${data.year}` 
      };
      
    } catch (error) {
      console.error('Add yearly data error:', error);
      return { success: false, message: 'Database error while adding yearly data' };
    }
  }
  
  private static generatePortfolioAnalysis(context: AgentContext): AgentResponse {
    const holdings = context.currentHoldings || [];
    const totalValue = holdings.reduce((sum, h) => sum + (h.valueSGD || 0), 0);
    const holdingsCount = holdings.length;
    
    let analysis = `Your portfolio has ${holdingsCount} holdings worth ${totalValue.toLocaleString()} ${context.displayCurrency}.\n\n`;
    
    if (holdingsCount > 0) {
      const categories = holdings.reduce((acc, h) => {
        acc[h.category] = (acc[h.category] || 0) + (h.valueSGD || 0);
        return acc;
      }, {} as Record<string, number>);
      
      analysis += 'Allocation:\n';
      Object.entries(categories).forEach(([category, value]) => {
        const percentage = ((value as number / totalValue) * 100).toFixed(1);
        analysis += `• ${category}: ${percentage}% (${(value as number).toLocaleString()} ${context.displayCurrency})\n`;
      });
    }
    
    return {
      action: 'analyze',
      data: { totalValue, holdingsCount, categories: holdings.reduce((acc, h) => {
        acc[h.category] = (acc[h.category] || 0) + (h.valueSGD || 0);
        return acc;
      }, {} as Record<string, number>) },
      message: analysis,
      confidence: 0.9
    };
  }

  private static generateCompanyName(symbol: string): string {
    // Map common symbols to company names
    const companyNames: Record<string, string> = {
      'CRCL': 'Circle Internet Financial Inc',
      'AAPL': 'Apple Inc',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc',
      'AMZN': 'Amazon.com Inc',
      'TSLA': 'Tesla Inc',
      'NVDA': 'NVIDIA Corporation',
      'META': 'Meta Platforms Inc',
      'NFLX': 'Netflix Inc',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'VUAA': 'Vanguard S&P 500 UCITS ETF',
      'INDIA': 'iShares MSCI India ETF'
    };
    
    return companyNames[symbol] || `${symbol} Corporation`;
  }

  private static getContextAwareSuggestions(quickQueryType: string | undefined): string[] {
    const allSuggestions = [
      'Show my portfolio summary',
      'What\'s my biggest holding?',
      'Show allocation gaps'
    ];

    // If we just showed a specific type, don't suggest it again
    if (quickQueryType === 'portfolio_summary') {
      return allSuggestions.filter(s => !s.includes('portfolio summary'));
    } else if (quickQueryType === 'biggest_holding') {
      return allSuggestions.filter(s => !s.includes('biggest holding'));
    } else if (quickQueryType === 'allocation_gaps') {
      return allSuggestions.filter(s => !s.includes('allocation gaps'));
    } else if (quickQueryType === 'total_value') {
      return allSuggestions.filter(s => !s.includes('portfolio summary'));
    }

    // Default: show all suggestions
    return allSuggestions;
  }

  // Shared utility function to get or create default user
  private static async getOrCreateDefaultUser() {
    let user = await prisma.user.findFirst({
      where: { id: 'default-user' }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'default-user',
          email: 'default@example.com',
          name: 'Default User'
        }
      });
    }
    
    return user;
  }

  // Shared utility function to get or create category
  private static async getOrCreateCategory(categoryName: string, userId: string) {
    let category = await prisma.assetCategory.findFirst({
      where: { 
        name: categoryName || 'Growth',
        userId: userId
      }
    });
    
    if (!category) {
      category = await prisma.assetCategory.create({
        data: {
          name: categoryName || 'Growth',
          targetPercentage: 25,
          userId: userId
        }
      });
    }
    
    return category;
  }
} 