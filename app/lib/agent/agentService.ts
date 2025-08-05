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
import { type CurrencyCode, convertToAllCurrencies } from '@/app/lib/currency';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PortfolioAgent {
  static async processMessage(request: AgentRequest): Promise<AgentResponse> {
    try {
      const { message, context } = request;
      
      console.log('🔍 Processing message:', message);
      
      // Handle simple confirmations first (yes/no/ok)
      const simpleConfirmation = this.handleSimpleConfirmation(message);
      if (simpleConfirmation) {
        return simpleConfirmation;
      }
      
      // First, try quick queries (no OpenAI cost)
      const quickResult = await QuickQueryHandler.handleQuery(
        message,
        context.currentHoldings || [],
        (context.displayCurrency as CurrencyCode) || 'SGD',
        context.exchangeRates || null,
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
          suggestions: ['Try rephrasing your request', 'Show portfolio summary', 'Add a new holding']
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
        requires_confirmation: llmResponse.requires_confirmation || false
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
                  message: `I found an existing holding: ${matchResult.bestMatch.name} (${matchResult.bestMatch.symbol}). Would you like to add ${entities.quantity} shares${entities.unitPrice ? ` at $${entities.unitPrice}` : ''} to this existing position?${!entities.unitPrice ? ' Please specify the price you paid.' : ''}`,
                  confidence: validation.confidence,
                  requires_confirmation: true
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
              
              // If no match found, return confirmation for new holding
              if (matchResult.suggestedAction === 'create_new') {
                return {
                  action: 'confirm',
                  data: {
                    intent: 'add_holding',
                    entities: entities,
                    confidence: llmResponse.confidence
                  },
                  message: `I'll add ${entities.quantity} shares of ${entities.symbol} at $${entities.unitPrice} to your portfolio. Please confirm.`,
                  confidence: validation.confidence,
                  requires_confirmation: true
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
  
  static async executeAction(action: AgentAction): Promise<{ success: boolean; message: string; data?: any; originalData?: any }> {
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
          
        case 'undo_action':
          return await this.executeUndoAction(action.data);
          
        case 'confirm_action':
          // Handle simple confirmations - this should trigger the pending action
          if (action.data && action.data.originalAction) {
            // Execute the original action that was pending confirmation
            const originalAction = {
              type: action.data.originalAction,
              data: action.data.originalEntities
            };
            return await this.executeAction(originalAction);
          }
          return { success: true, message: 'Action confirmed. Please proceed with your request.', data: action.data };
          
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
  
  private static async executeAddHolding(data: any): Promise<{ success: boolean; message: string; data?: any; originalData?: any }> {
    try {
      const { symbol, quantity, unitPrice, category, currency = 'USD', costBasisCurrency = 'USD' } = data;
      
      // Round all numeric values to 2 decimal places
      const roundedQuantity = Math.round(quantity * 100) / 100;
      const roundedUnitPrice = Math.round(unitPrice * 100) / 100;
      const roundedCostBasis = Math.round(roundedQuantity * roundedUnitPrice * 100) / 100;

      const user = await this.getOrCreateDefaultUser();
      const categoryRecord = await this.getOrCreateCategory(category, user.id);

      const holding = await prisma.holdings.create({
        data: {
          symbol: symbol.toUpperCase(),
          name: this.generateCompanyName(symbol),
          quantity: roundedQuantity,
          unitPrice: roundedUnitPrice,
          costBasis: roundedCostBasis,
          valueSGD: roundedCostBasis * 1.35, // Approximate conversion
          valueUSD: roundedCostBasis,
          valueINR: roundedCostBasis * 83, // Approximate conversion
          entryCurrency: currency.toUpperCase(),
          location: 'IBKR',
          categoryId: categoryRecord.id,
          userId: user.id
        }
      });

      return {
        success: true,
        message: `✅ Added ${roundedQuantity} shares of ${symbol.toUpperCase()} at $${roundedUnitPrice} (${currency.toUpperCase()}) for a total cost of $${roundedCostBasis} (${costBasisCurrency.toUpperCase()})`,
        data: holding,
        originalData: null // New holding, no original data
      };
    } catch (error) {
      console.error('Error adding holding:', error);
      return {
        success: false,
        message: 'Failed to add holding. Please try again.',
        data: null
      };
    }
  }

  private static async executeAddToExistingHolding(data: any): Promise<{ success: boolean; message: string; data?: any; originalData?: any }> {
    try {
      const { symbol, quantity, unitPrice, currency = 'USD', costBasisCurrency = 'USD' } = data;
      
      // Round all numeric values to 2 decimal places
      const roundedQuantity = Math.round(quantity * 100) / 100;
      
      // Handle case where unitPrice is undefined
      let roundedUnitPrice: number;
      if (unitPrice === undefined || unitPrice === null || isNaN(unitPrice)) {
        // If no price specified, we need to ask the user for the price
        return {
          success: false,
          message: `Please specify the price you paid for ${quantity} shares of ${symbol.toUpperCase()}. For example: "add 200 shares of IREN at $15"`,
          data: null
        };
      }
      
      roundedUnitPrice = Math.round(unitPrice * 100) / 100;
      const newCostBasis = Math.round(roundedQuantity * roundedUnitPrice * 100) / 100;

      const user = await this.getOrCreateDefaultUser();
      
      // Find existing holding
      const existingHolding = await prisma.holdings.findFirst({
        where: {
          symbol: symbol.toUpperCase()
        }
      });

      if (!existingHolding) {
        return {
          success: false,
          message: `Holding ${symbol.toUpperCase()} not found. Please add it as a new holding.`,
          data: null
        };
      }

      // Store original data for undo
      const originalData = { ...existingHolding };

      // Calculate weighted average
      const existingQuantity = Number(existingHolding.quantity) || 0;
      const existingCostBasis = Number(existingHolding.costBasis) || 0;
      const totalQuantity = Math.round((existingQuantity + roundedQuantity) * 100) / 100;
      const totalCostBasis = Math.round((existingCostBasis + newCostBasis) * 100) / 100;
      const weightedAveragePrice = Math.round((totalCostBasis / totalQuantity) * 100) / 100;

      console.log('Weighted average calculation:', {
        existingQuantity: existingQuantity,
        newQuantity: roundedQuantity,
        totalQuantity,
        existingCostBasis: existingCostBasis,
        newCostBasis,
        totalCostBasis,
        weightedAveragePrice
      });

      // Calculate new values based on total quantity and current unit price
      const currentUnitPrice = Number(existingHolding.currentUnitPrice) || Number(existingHolding.unitPrice) || 0;
      const newTotalValue = totalQuantity * currentUnitPrice;
      
      // Use default exchange rates for conversion
      const defaultRates = {
        SGD_TO_USD: 0.74,
        SGD_TO_INR: 63.50,
        USD_TO_SGD: 1.35,
        USD_TO_INR: 85.50,
        INR_TO_SGD: 0.0157,
        INR_TO_USD: 0.0117
      };
      
      // Convert to all currencies using the proper function
      // The newTotalValue is already in the entry currency, so we pass it directly
      const convertedValues = convertToAllCurrencies(
        newTotalValue, 
        existingHolding.entryCurrency as CurrencyCode, 
        defaultRates
      );
      
      // Update the holding
      const updatedHolding = await prisma.holdings.update({
        where: { id: existingHolding.id },
        data: {
          quantity: totalQuantity,
          unitPrice: weightedAveragePrice,
          costBasis: totalCostBasis,
          valueSGD: convertedValues.valueSGD,
          valueUSD: convertedValues.valueUSD,
          valueINR: convertedValues.valueINR
        }
      });

      return {
        success: true,
        message: `✅ Added ${roundedQuantity} shares of ${symbol.toUpperCase()} at $${roundedUnitPrice} (${currency.toUpperCase()}). New weighted average price: $${weightedAveragePrice} (${costBasisCurrency.toUpperCase()}). Total shares: ${totalQuantity}`,
        data: updatedHolding,
        originalData
      };
    } catch (error) {
      console.error('Error adding to existing holding:', error);
      return {
        success: false,
        message: 'Failed to add to existing holding. Please try again.',
        data: null
      };
    }
  }

  private static async executeEditHolding(data: any): Promise<{ success: boolean; message: string; data?: any; originalData?: any }> {
    try {
      const { id, symbol, quantity, unitPrice, category, currency = 'USD', costBasisCurrency = 'USD' } = data;
      
      // Round all numeric values to 2 decimal places
      const roundedQuantity = Math.round(quantity * 100) / 100;
      const roundedUnitPrice = Math.round(unitPrice * 100) / 100;
      const roundedCostBasis = Math.round(roundedQuantity * roundedUnitPrice * 100) / 100;

      // Get original data for undo
      const originalHolding = await prisma.holdings.findUnique({
        where: { id: id }
      });

      if (!originalHolding) {
        return {
          success: false,
          message: 'Holding not found.',
          data: null
        };
      }

      const user = await this.getOrCreateDefaultUser();
      const categoryRecord = await this.getOrCreateCategory(category, user.id);

      const updatedHolding = await prisma.holdings.update({
        where: { id: id },
        data: {
          symbol: symbol.toUpperCase(),
          quantity: roundedQuantity,
          unitPrice: roundedUnitPrice,
          costBasis: roundedCostBasis,
          entryCurrency: currency.toUpperCase(),
          categoryId: categoryRecord.id
        }
      });

      return {
        success: true,
        message: `✅ Updated ${symbol.toUpperCase()}: ${roundedQuantity} shares at $${roundedUnitPrice} (${currency.toUpperCase()}) for a total cost of $${roundedCostBasis} (${costBasisCurrency.toUpperCase()})`,
        data: updatedHolding,
        originalData: originalHolding
      };
    } catch (error) {
      console.error('Error editing holding:', error);
      return {
        success: false,
        message: 'Failed to edit holding. Please try again.',
        data: null
      };
    }
  }

  private static async executeDeleteHolding(data: any): Promise<{ success: boolean; message: string; data?: any; originalData?: any }> {
    try {
      const { id } = data;
      
      // Get original data for undo
      const originalHolding = await prisma.holdings.findUnique({
        where: { id: id },
        include: { category: true }
      });

      if (!originalHolding) {
        return {
          success: false,
          message: 'Holding not found.',
          data: null
        };
      }

      // Round values for display
      const roundedQuantity = Math.round((Number(originalHolding.quantity) || 0) * 100) / 100;
      const roundedUnitPrice = Math.round((Number(originalHolding.unitPrice) || 0) * 100) / 100;
      const roundedCostBasis = Math.round((Number(originalHolding.costBasis) || 0) * 100) / 100;

      await prisma.holdings.delete({
        where: { id: id }
      });

      return {
        success: true,
        message: `✅ Deleted ${roundedQuantity} shares of ${originalHolding.symbol} at $${roundedUnitPrice} (${originalHolding.entryCurrency}) for a total cost of $${roundedCostBasis} (${originalHolding.entryCurrency})`,
        data: null,
        originalData: originalHolding
      };
    } catch (error) {
      console.error('Error deleting holding:', error);
      return {
        success: false,
        message: 'Failed to delete holding. Please try again.',
        data: null
      };
    }
  }

  private static async executeReduceHolding(data: any): Promise<{ success: boolean; message: string; data?: any; originalData?: any }> {
    try {
      const { symbol, quantity, unitPrice, currency = 'USD' } = data;
      
      // Round all numeric values to 2 decimal places
      const roundedQuantity = Math.round(quantity * 100) / 100;
      const roundedUnitPrice = Math.round(unitPrice * 100) / 100;
      const roundedCostBasis = Math.round(roundedQuantity * roundedUnitPrice * 100) / 100;

      // Find the holding by symbol
      const existingHolding = await prisma.holdings.findFirst({
        where: { symbol: symbol.toUpperCase() }
      });

      if (!existingHolding) {
        return {
          success: false,
          message: `Holding ${symbol.toUpperCase()} not found.`,
          data: null
        };
      }

      // Store original data for undo
      const originalData = { ...existingHolding };

      const currentQuantity = Number(existingHolding.quantity) || 0;
      const currentCostBasis = Number(existingHolding.costBasis) || 0;

      if (currentQuantity < roundedQuantity) {
        return {
          success: false,
          message: `Cannot reduce ${roundedQuantity} shares when you only have ${currentQuantity} shares of ${symbol.toUpperCase()}.`,
          data: null
        };
      }

      const remainingQuantity = Math.round((currentQuantity - roundedQuantity) * 100) / 100;
      const remainingCostBasis = Math.round((currentCostBasis - roundedCostBasis) * 100) / 100;

      if (remainingQuantity <= 0) {
        // Delete the holding if no shares remain
        await prisma.holdings.delete({
          where: { id: existingHolding.id }
        });

        return {
          success: true,
          message: `✅ Sold all ${roundedQuantity} shares of ${existingHolding.symbol} at $${roundedUnitPrice} (${currency.toUpperCase()}) for a total of $${roundedCostBasis} (${existingHolding.entryCurrency})`,
          data: null,
          originalData
        };
      } else {
        // Calculate new values based on remaining quantity and current unit price
        const currentUnitPrice = Number(existingHolding.currentUnitPrice) || Number(existingHolding.unitPrice) || 0;
        const newTotalValue = remainingQuantity * currentUnitPrice;
        
        // Use default exchange rates for conversion
        const defaultRates = {
          SGD_TO_USD: 0.74,
          SGD_TO_INR: 63.50,
          USD_TO_SGD: 1.35,
          USD_TO_INR: 85.50,
          INR_TO_SGD: 0.0157,
          INR_TO_USD: 0.0117
        };
        
        // Convert to all currencies using the proper function
        const convertedValues = convertToAllCurrencies(
          newTotalValue, 
          existingHolding.entryCurrency as CurrencyCode, 
          defaultRates
        );
        
        // Update the holding with remaining shares and recalculated values
        const updatedHolding = await prisma.holdings.update({
          where: { id: existingHolding.id },
          data: {
            quantity: remainingQuantity,
            costBasis: remainingCostBasis,
            valueSGD: convertedValues.valueSGD,
            valueUSD: convertedValues.valueUSD,
            valueINR: convertedValues.valueINR
          }
        });

        return {
          success: true,
          message: `✅ Sold ${roundedQuantity} shares of ${existingHolding.symbol} at $${roundedUnitPrice} (${currency.toUpperCase()}) for a total of $${roundedCostBasis} (${existingHolding.entryCurrency}). Remaining: ${remainingQuantity} shares`,
          data: updatedHolding,
          originalData
        };
      }
    } catch (error) {
      console.error('Error reducing holding:', error);
      return {
        success: false,
        message: 'Failed to reduce holding. Please try again.',
        data: null
      };
    }
  }

  private static async executeIncreaseHolding(data: any): Promise<{ success: boolean; message: string; data?: any; originalData?: any }> {
    try {
      const { id, quantity, unitPrice, currency = 'USD' } = data;
      
      // Round all numeric values to 2 decimal places
      const roundedQuantity = Math.round(quantity * 100) / 100;
      const roundedUnitPrice = Math.round(unitPrice * 100) / 100;
      const newCostBasis = Math.round(roundedQuantity * roundedUnitPrice * 100) / 100;

      const existingHolding = await prisma.holdings.findUnique({
        where: { id: id }
      });

      if (!existingHolding) {
        return {
          success: false,
          message: 'Holding not found.',
          data: null
        };
      }

      // Store original data for undo
      const originalData = { ...existingHolding };

      // Calculate weighted average
      const existingQuantity = Number(existingHolding.quantity) || 0;
      const existingCostBasis = Number(existingHolding.costBasis) || 0;
      const totalQuantity = Math.round((existingQuantity + roundedQuantity) * 100) / 100;
      const totalCostBasis = Math.round((existingCostBasis + newCostBasis) * 100) / 100;
      const weightedAveragePrice = Math.round((totalCostBasis / totalQuantity) * 100) / 100;

      const updatedHolding = await prisma.holdings.update({
        where: { id: id },
        data: {
          quantity: totalQuantity,
          unitPrice: weightedAveragePrice,
          costBasis: totalCostBasis
        }
      });

      return {
        success: true,
        message: `✅ Added ${roundedQuantity} shares of ${existingHolding.symbol} at $${roundedUnitPrice} (${currency.toUpperCase()}). New weighted average price: $${weightedAveragePrice} (${existingHolding.entryCurrency}). Total shares: ${totalQuantity}`,
        data: updatedHolding,
        originalData
      };
    } catch (error) {
      console.error('Error increasing holding:', error);
      return {
        success: false,
        message: 'Failed to increase holding. Please try again.',
        data: null
      };
    }
  }

  private static async executeAddYearlyData(data: any): Promise<{ success: boolean; message: string; data?: any; originalData?: any }> {
    try {
      const { year, netWorth, savings, srs, notes } = data;
      
      // Round all numeric values to 2 decimal places
      const roundedNetWorth = Math.round(netWorth * 100) / 100;
      const roundedSavings = Math.round(savings * 100) / 100;
      const roundedSrs = Math.round(srs * 100) / 100;

      const user = await this.getOrCreateDefaultUser();

      // Check if yearly data already exists
      const existingData = await prisma.yearlyData.findFirst({
        where: {
          year: parseInt(year),
          userId: user.id
        }
      });

      if (existingData) {
        // Store original data for undo
        const originalData = { ...existingData };

        const updatedData = await prisma.yearlyData.update({
          where: { id: existingData.id },
          data: {
            netWorth: roundedNetWorth,
            savings: roundedSavings,
            srs: roundedSrs,
            notes: notes || ''
          }
        });

        return {
          success: true,
          message: `✅ Updated ${year} data: Net Worth $${roundedNetWorth.toLocaleString()}, Savings $${roundedSavings.toLocaleString()}, SRS $${roundedSrs.toLocaleString()}`,
          data: updatedData,
          originalData
        };
      } else {
        const newData = await prisma.yearlyData.create({
          data: {
            year: parseInt(year),
            netWorth: roundedNetWorth,
            savings: roundedSavings,
            srs: roundedSrs,
            notes: notes || '',
            userId: user.id
          }
        });

        return {
          success: true,
          message: `✅ Added ${year} data: Net Worth $${roundedNetWorth.toLocaleString()}, Savings $${roundedSavings.toLocaleString()}, SRS $${roundedSrs.toLocaleString()}`,
          data: newData,
          originalData: null
        };
      }
    } catch (error) {
      console.error('Error adding yearly data:', error);
      return {
        success: false,
        message: 'Failed to add yearly data. Please try again.',
        data: null
      };
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

  private static handleSimpleConfirmation(message: string): AgentResponse | null {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check for positive confirmations
    if (['yes', 'y', 'ok', 'okay', 'sure', 'confirm', 'proceed', 'go ahead', 'do it'].includes(normalizedMessage)) {
      return {
        action: 'execute',
        data: {
          intent: 'confirm_action',
          entities: { confirmed: true }
        },
        message: 'Proceeding with the action...',
        confidence: 1.0,
        suggestions: [],
        requires_confirmation: false
      };
    }
    
    // Check for negative confirmations
    if (['no', 'n', 'cancel', 'stop', 'don\'t', 'dont'].includes(normalizedMessage)) {
      return {
        action: 'clarify',
        data: {
          intent: 'cancel_action',
          entities: { confirmed: false }
        },
        message: 'Action cancelled. How else can I help you?',
        confidence: 1.0,
        suggestions: ['Show portfolio summary', 'Add a new holding', 'Show my biggest holding'],
        requires_confirmation: false
      };
    }
    
    return null;
  }

  private static getContextAwareSuggestions(quickQueryType: string | undefined): string[] {
    // Focus on 80/20 - most useful actions only
    const coreSuggestions = [
      'Add a new holding',
      'Show portfolio summary',
      'Show my biggest holding'
    ];

    // Add context-specific suggestions
    if (quickQueryType === 'portfolio_summary') {
      return [
        'Add a new holding',
        'Show my biggest holding'
      ];
    }

    return coreSuggestions;
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

  private static async executeUndoAction(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { originalAction, originalEntities } = data;
      const { originalData } = originalEntities;

      switch (originalAction) {
        case 'add_holding':
          // Delete the newly created holding
          if (originalData && originalData.id) {
            await prisma.holdings.delete({
              where: { id: originalData.id }
            });
            return {
              success: true,
              message: `✅ Undone: Deleted ${originalData.symbol} holding`,
              data: null
            };
          }
          break;

        case 'add_to_existing_holding':
        case 'increase_holding':
          // Restore original quantity and cost basis
          if (originalData && originalData.id) {
            await prisma.holdings.update({
              where: { id: originalData.id },
              data: {
                quantity: Math.round(originalData.quantity * 100) / 100,
                unitPrice: Math.round(originalData.unitPrice * 100) / 100,
                costBasis: Math.round(originalData.costBasis * 100) / 100
              }
            });
            return {
              success: true,
              message: `✅ Undone: Restored ${originalData.symbol} to original state`,
              data: null
            };
          }
          break;

        case 'edit_holding':
          // Restore original values
          if (originalData && originalData.id) {
            await prisma.holdings.update({
              where: { id: originalData.id },
              data: {
                symbol: originalData.symbol,
                quantity: Math.round((originalData.quantity || 0) * 100) / 100,
                unitPrice: Math.round((originalData.unitPrice || 0) * 100) / 100,
                costBasis: Math.round((originalData.costBasis || 0) * 100) / 100,
                entryCurrency: originalData.entryCurrency,
                categoryId: originalData.categoryId
              }
            });
            return {
              success: true,
              message: `✅ Undone: Restored ${originalData.symbol} to original state`,
              data: null
            };
          }
          break;

        case 'delete_holding':
          // Recreate the deleted holding
          if (originalData) {
            const user = await this.getOrCreateDefaultUser();
            const categoryRecord = await this.getOrCreateCategory(originalData.category.name, user.id);
            
            await prisma.holdings.create({
              data: {
                symbol: originalData.symbol,
                name: originalData.name,
                quantity: Math.round((originalData.quantity || 0) * 100) / 100,
                unitPrice: Math.round((originalData.unitPrice || 0) * 100) / 100,
                costBasis: Math.round((originalData.costBasis || 0) * 100) / 100,
                entryCurrency: originalData.entryCurrency,
                categoryId: categoryRecord.id,
                userId: user.id,
                valueSGD: Number(originalData.valueSGD) || 0,
                valueUSD: Number(originalData.valueUSD) || 0,
                valueINR: Number(originalData.valueINR) || 0,
                location: originalData.location || 'IBKR'
              }
            });
            return {
              success: true,
              message: `✅ Undone: Restored ${originalData.symbol} holding`,
              data: null
            };
          }
          break;

        case 'add_yearly_data':
          // Delete the yearly data
          if (originalData && originalData.id) {
            await prisma.yearlyData.delete({
              where: { id: originalData.id }
            });
            return {
              success: true,
              message: `✅ Undone: Deleted ${originalData.year} data`,
              data: null
            };
          }
          break;

        default:
          return {
            success: false,
            message: 'Cannot undo this action.',
            data: null
          };
      }

      return {
        success: false,
        message: 'Failed to undo action.',
        data: null
      };
    } catch (error) {
      console.error('Error undoing action:', error);
      return {
        success: false,
        message: 'Failed to undo action. Please try again.',
        data: null
      };
    }
  }
} 