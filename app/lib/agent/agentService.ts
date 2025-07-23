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
      
      // Convert currency values (for now, assume SGD as base)
      let valueSGD = totalValue;
      let valueUSD = 0;
      let valueINR = 0;
      
      if (data.currency === 'USD') {
        valueUSD = totalValue;
        valueSGD = totalValue * 1.35; // Approximate USD to SGD conversion
      } else if (data.currency === 'INR') {
        valueINR = totalValue;
        valueSGD = totalValue / 63.5; // Approximate INR to SGD conversion
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
      
      // Create the holding
      const holding = await prisma.holdings.create({
        data: {
          symbol: data.symbol,
          name: data.name || `${data.symbol} Stock`,
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
} 