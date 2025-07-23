// app/lib/agent/validator.ts
import { ValidationResult, ExtractedHoldingData, ExtractedYearlyData, AgentContext } from './types';

export class DataValidator {
  static async validateHoldingData(data: ExtractedHoldingData, context: AgentContext): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Required fields validation
    if (!data.symbol) {
      errors.push('Symbol is required');
    } else if (data.symbol.length < 1 || data.symbol.length > 10) {
      errors.push('Symbol must be 1-10 characters');
    }
    
    // Quantity validation
    if (data.quantity !== undefined) {
      if (data.quantity <= 0) {
        errors.push('Quantity must be greater than 0');
      } else if (data.quantity > 1000000) {
        warnings.push('Quantity seems very large - please verify');
      }
    }
    
    // Price validation
    if (data.unitPrice !== undefined) {
      if (data.unitPrice <= 0) {
        errors.push('Price must be greater than 0');
      } else if (data.unitPrice > 100000) {
        warnings.push('Price seems very high - please verify');
      }
    }
    
    // Category validation
    if (data.category && !['core', 'growth', 'hedge', 'liquidity'].includes(data.category.toLowerCase())) {
      errors.push('Category must be one of: Core, Growth, Hedge, Liquidity');
    }
    
    // Check if holding already exists
    if (data.symbol && context.currentHoldings) {
      const existingHolding = context.currentHoldings.find(
        h => h.symbol.toLowerCase() === data.symbol?.toLowerCase()
      );
      if (existingHolding) {
        warnings.push(`Holding ${data.symbol} already exists in your portfolio`);
        suggestions.push('Consider editing the existing holding instead');
      }
    }
    
    // Currency validation
    if (data.currency && !['SGD', 'USD', 'INR'].includes(data.currency.toUpperCase())) {
      errors.push('Currency must be SGD, USD, or INR');
    }
    
    const confidence = this.calculateConfidence(errors, warnings);
    
    return {
      isValid: errors.length === 0,
      confidence,
      errors,
      warnings,
      suggestions
    };
  }
  
  static async validateYearlyData(data: ExtractedYearlyData, context: AgentContext): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Year validation
    if (data.year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (data.year < 1900 || data.year > currentYear + 10) {
        errors.push('Year must be between 1900 and ' + (currentYear + 10));
      }
      
      // Check if year already exists
      if (context.yearlyData) {
        const existingYear = context.yearlyData.find(y => y.year === data.year);
        if (existingYear) {
          warnings.push(`Data for ${data.year} already exists`);
          suggestions.push('This will update the existing year data');
        }
      }
    }
    
    // Financial data validation
    const financialFields = ['income', 'expenses', 'netWorth', 'savings', 'marketGains'];
    for (const field of financialFields) {
      const value = data[field as keyof ExtractedYearlyData];
      if (value !== undefined) {
        if (value < 0) {
          errors.push(`${field} cannot be negative`);
        } else if (value > 1000000000) {
          warnings.push(`${field} seems very large - please verify`);
        }
      }
    }
    
    // Logical validation
    if (data.income !== undefined && data.expenses !== undefined && data.savings !== undefined) {
      const calculatedSavings = data.income - data.expenses;
      const difference = Math.abs(calculatedSavings - data.savings);
      if (difference > 1000) {
        warnings.push('Savings amount doesn\'t match income minus expenses');
        suggestions.push(`Expected savings: ${calculatedSavings.toLocaleString()}`);
      }
    }
    
    const confidence = this.calculateConfidence(errors, warnings);
    
    return {
      isValid: errors.length === 0,
      confidence,
      errors,
      warnings,
      suggestions
    };
  }
  
  private static calculateConfidence(errors: string[], warnings: string[]): number {
    if (errors.length > 0) return 0;
    if (warnings.length > 2) return 0.7;
    if (warnings.length > 0) return 0.85;
    return 0.95;
  }
  
  static generateConfirmationMessage(data: any, intent: string): string {
    switch (intent) {
      case 'add_holding':
        return `I'll add ${data.quantity || 'some'} shares of ${data.symbol} to your portfolio.${data.unitPrice ? ` Price: $${data.unitPrice}` : ''}${data.category ? ` Category: ${data.category}` : ''}`;
      
      case 'edit_holding':
        return `I'll update your ${data.symbol} holding.${data.quantity ? ` New quantity: ${data.quantity}` : ''}${data.unitPrice ? ` New price: $${data.unitPrice}` : ''}`;
      
      case 'delete_holding':
        return `I'll remove ${data.symbol} from your portfolio. This action cannot be undone.`;
      
      case 'add_yearly_data':
        return `I'll add data for ${data.year}:${data.income ? ` Income: $${data.income.toLocaleString()}` : ''}${data.expenses ? ` Expenses: $${data.expenses.toLocaleString()}` : ''}${data.netWorth ? ` Net Worth: $${data.netWorth.toLocaleString()}` : ''}`;
      
      default:
        return 'I understand your request. Please confirm the details above.';
    }
  }
  
  static generateClarificationMessage(errors: string[], warnings: string[]): string {
    if (errors.length > 0) {
      return `I need some clarification:\n${errors.map(e => `• ${e}`).join('\n')}`;
    }
    
    if (warnings.length > 0) {
      return `Please verify these details:\n${warnings.map(w => `• ${w}`).join('\n')}`;
    }
    
    return 'I didn\'t understand that. Could you rephrase your request?';
  }
} 