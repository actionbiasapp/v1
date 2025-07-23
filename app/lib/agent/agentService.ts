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
import { IntentRecognition } from './intentRecognition';
import { DataValidator } from './validator';
import { SmartHoldingMatcher, SmartMatchResult } from './smartMatching';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PortfolioAgent {
  static async processMessage(request: AgentRequest): Promise<AgentResponse> {
    try {
      const { message, context } = request;
      
      // Step 1: Intent Recognition
      const intentResult = IntentRecognition.recognizeIntent(message);
      
      if (intentResult.intent === 'unknown') {
        return {
          action: 'clarify',
          data: null,
          message: 'I didn\'t understand that. Try saying something like "Add 100 shares of AAPL" or "2023 income was $120k"',
          confidence: 0,
          suggestions: [
            'Add 100 shares of AAPL at $150',
            '2023 income was $120,000',
            'Delete TSLA holding',
            'How is my portfolio performing?'
          ]
        };
      }
      
      // Step 2: Data Extraction
      let extractedData: any = {};
      let validation: ValidationResult;
      
      switch (intentResult.intent) {
        case 'add_holding':
        case 'edit_holding':
        case 'delete_holding':
          extractedData = IntentRecognition.extractHoldingData(message);
          validation = await DataValidator.validateHoldingData(extractedData, context);
          
          // For add_holding, perform smart matching
          if (intentResult.intent === 'add_holding' && validation.isValid) {
            const matchResult = await SmartHoldingMatcher.findMatches(
              extractedData.symbol, 
              context.currentHoldings || []
            );
            
            // If we found a good match, suggest adding to existing holding
            if (matchResult.suggestedAction === 'add_to_existing' && matchResult.bestMatch) {
              return {
                action: 'confirm',
                data: {
                  intent: 'add_to_existing_holding',
                  entities: {
                    ...extractedData,
                    existingHoldingId: matchResult.bestMatch.id,
                    existingHoldingName: matchResult.bestMatch.name,
                    matchConfidence: matchResult.bestMatch.confidence
                  },
                  confidence: intentResult.confidence
                },
                message: `I found an existing holding: ${matchResult.bestMatch.name} (${matchResult.bestMatch.symbol}). Would you like to add ${extractedData.quantity} shares at $${extractedData.unitPrice} to this existing position?`,
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
                  entities: extractedData,
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
            
            // If we've already handled the response above (add_to_existing or clarify), don't continue
            if (matchResult.suggestedAction === 'add_to_existing' || matchResult.suggestedAction === 'clarify') {
              // This should never be reached due to early returns above, but just in case
              return {
                action: 'error',
                data: null,
                message: 'Unexpected state in smart matching.',
                confidence: 0
              };
            }
            // If create_new, continue to Step 3 for new holding creation
          }
          
          break;
          
        case 'add_yearly_data':
          extractedData = IntentRecognition.extractYearlyData(message);
          validation = await DataValidator.validateYearlyData(extractedData, context);
          break;
          
        case 'portfolio_analysis':
          return this.generatePortfolioAnalysis(context);
          
        default:
          return {
            action: 'clarify',
            data: null,
            message: 'I\'m not sure how to handle that request yet.',
            confidence: 0
          };
      }
      
      // Step 3: Generate Response
      if (validation.isValid) {
        return {
          action: 'confirm',
          data: {
            intent: intentResult.intent,
            entities: extractedData,
            confidence: intentResult.confidence
          },
          message: DataValidator.generateConfirmationMessage(extractedData, intentResult.intent),
          confidence: validation.confidence
        };
      } else {
        return {
          action: 'clarify',
          data: null,
          message: DataValidator.generateClarificationMessage(validation.errors, validation.warnings),
          confidence: validation.confidence,
          suggestions: validation.suggestions
        };
      }
      
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
          
        case 'add_to_existing_holding':
          return await this.executeAddToExistingHolding(action.data);
          
        case 'edit_holding':
          return await this.executeEditHolding(action.data);
          
        case 'delete_holding':
          return await this.executeDeleteHolding(action.data);
          
        case 'add_yearly_data':
          return await this.executeAddYearlyData(action.data);
          
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
      
      // Get or create category
      let category = await prisma.assetCategory.findFirst({
        where: { 
          name: data.category || 'Growth',
          userId: user.id
        }
      });
      
      if (!category) {
        category = await prisma.assetCategory.create({
          data: {
            name: data.category || 'Growth',
            targetPercentage: 25,
            userId: user.id
          }
        });
      }
      
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
    // For now, return a placeholder - we'll need to find the holding ID first
    return { success: false, message: 'Edit holding not implemented yet' };
  }
  
  private static async executeDeleteHolding(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    // For now, return a placeholder - we'll need to find the holding ID first
    return { success: false, message: 'Delete holding not implemented yet' };
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
} 