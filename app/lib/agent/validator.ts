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
      let editMessage = `I'll update your ${data.symbol} holding.`;
      if (data.newSymbol) editMessage += ` Rename to: ${data.newSymbol}`;
      if (data.name) editMessage += ` New name: ${data.name}`;
      if (data.category) editMessage += ` New category: ${data.category}`;
      if (data.location) editMessage += ` New location: ${data.location}`;
      if (data.quantity) editMessage += ` New quantity: ${data.quantity}`;
      if (data.unitPrice) editMessage += ` New buy price: $${data.unitPrice}`;
      if (data.currentUnitPrice) editMessage += ` New current price: $${data.currentUnitPrice}`;
      if (data.manualPricing !== undefined) editMessage += ` Manual pricing: ${data.manualPricing ? 'enabled' : 'disabled'}`;
      if (data.assetType) editMessage += ` New asset type: ${data.assetType}`;
      return editMessage;
      
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

// Enhanced validation for edit holding operations
export function validateEditHoldingData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate symbol
  if (data.symbol && typeof data.symbol !== 'string') {
    errors.push('Symbol must be a string');
  }
  
  // Validate new symbol (if renaming)
  if (data.newSymbol && typeof data.newSymbol !== 'string') {
    errors.push('New symbol must be a string');
  }
  
  // Validate prices
  if (data.unitPrice !== undefined && (typeof data.unitPrice !== 'number' || data.unitPrice < 0)) {
    errors.push('Buy price must be a positive number');
  }
  
  if (data.currentUnitPrice !== undefined && (typeof data.currentUnitPrice !== 'number' || data.currentUnitPrice < 0)) {
    errors.push('Current price must be a positive number');
  }
  
  // Validate quantity
  if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity <= 0)) {
    errors.push('Quantity must be a positive number');
  }
  
  // Validate category
  if (data.category && !['Core', 'Growth', 'Hedge', 'Liquidity'].includes(data.category)) {
    errors.push('Invalid category. Must be one of: Core, Growth, Hedge, Liquidity');
  }
  
  // Validate asset type
  if (data.assetType && !['stock', 'crypto', 'manual'].includes(data.assetType)) {
    errors.push('Invalid asset type. Must be one of: stock, crypto, manual');
  }
  
  // Validate location
  if (data.location && typeof data.location !== 'string') {
    errors.push('Location must be a string');
  }
  
  // Validate manual pricing flag
  if (data.manualPricing !== undefined && typeof data.manualPricing !== 'boolean') {
    errors.push('Manual pricing must be a boolean');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Currency validation
export function validateCurrencyConsistency(holding: any, newData: any): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check for currency mismatches
  if (newData.unitPrice && newData.currentUnitPrice) {
    const priceChange = ((newData.currentUnitPrice - newData.unitPrice) / newData.unitPrice) * 100;
    
    if (Math.abs(priceChange) > 100) {
      warnings.push(`Large price change detected: ${priceChange.toFixed(2)}%. Please verify.`);
    }
    
    if (newData.currentUnitPrice < newData.unitPrice * 0.5) {
      warnings.push('Current price is less than 50% of buy price. Please verify.');
    }
  }
  
  // Check for quantity changes that might be errors
  if (newData.quantity && holding.quantity) {
    const quantityChange = ((newData.quantity - holding.quantity) / holding.quantity) * 100;
    
    if (Math.abs(quantityChange) > 50) {
      warnings.push(`Large quantity change detected: ${quantityChange.toFixed(2)}%. Please verify.`);
    }
  }
  
  return {
    isValid: true,
    warnings
  };
} 