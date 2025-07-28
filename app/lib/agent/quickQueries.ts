// app/lib/agent/quickQueries.ts - Handle quick database queries without OpenAI
import { type Holding } from '@/app/lib/types/shared';
import { type CurrencyCode } from '@/app/lib/currency';
import { calculatePortfolioValue, type ExchangeRates } from '@/app/lib/portfolioCalculations';

export interface QuickQueryResult {
  success: boolean;
  message: string;
  data?: any;
  action?: 'display' | 'highlight' | 'filter';
}

export class QuickQueryHandler {
  static async handleQuery(
    query: string, 
    holdings: Holding[], 
    displayCurrency: CurrencyCode,
    exchangeRates: ExchangeRates | null,
    financialProfile?: any
  ): Promise<QuickQueryResult> {
    try {
      const lowerQuery = query.toLowerCase();
      console.log('🔍 Quick query check:', lowerQuery);
      
      // Portfolio Summary
      if (lowerQuery.includes('portfolio summary') || lowerQuery.includes('summary')) {
        return this.getPortfolioSummary(holdings, displayCurrency, exchangeRates);
      }
      
      // Biggest Holding
      if (lowerQuery.includes('biggest holding') || lowerQuery.includes('largest')) {
        return this.getBiggestHolding(holdings, displayCurrency, exchangeRates);
      }
      
      // Allocation Gaps
      if (lowerQuery.includes('allocation gap') || lowerQuery.includes('gap')) {
        return this.getAllocationGaps(holdings, displayCurrency, exchangeRates, financialProfile);
      }
      
      // Total Value
      if (lowerQuery.includes('total value') || lowerQuery.includes('total') || 
          lowerQuery.includes('value of') || lowerQuery.includes('portfolio value') ||
          lowerQuery.includes('worth') || lowerQuery.includes('how much')) {
        return this.getTotalValue(holdings, displayCurrency, exchangeRates);
      }
      
      // Category Filter
      if (lowerQuery.includes('core') || lowerQuery.includes('growth') || 
          lowerQuery.includes('hedge') || lowerQuery.includes('liquidity')) {
        return this.getCategoryHoldings(query, holdings, displayCurrency, exchangeRates);
      }
      
      console.log('🔍 No quick query match found');
      // Not a quick query - needs OpenAI
      return { success: false, message: 'This requires AI analysis' };
    } catch (error) {
      console.error('❌ Quick query error:', error);
      return { success: false, message: 'Error processing quick query' };
    }
  }
  
  private static getPortfolioSummary(
    holdings: Holding[], 
    displayCurrency: CurrencyCode,
    exchangeRates: ExchangeRates | null
  ): QuickQueryResult {
    const portfolioResult = calculatePortfolioValue(holdings, displayCurrency, exchangeRates);
    const totalValue = portfolioResult.totalValue;
    const categories = this.groupByCategory(holdings);
    
    const summary = Object.entries(categories).map(([category, categoryHoldings]) => {
      const categoryResult = calculatePortfolioValue(categoryHoldings, displayCurrency, exchangeRates);
      const categoryValue = categoryResult.totalValue;
      const percentage = totalValue > 0 ? (categoryValue / totalValue) * 100 : 0;
      return `${category}: ${Math.round(categoryValue).toLocaleString()} (${percentage.toFixed(1)}%)`;
    }).join('\n');
    
    return {
      success: true,
      message: `📊 **Portfolio Summary**\n\nTotal Value: ${Math.round(totalValue).toLocaleString()} ${displayCurrency}\n\n${summary}`,
      action: 'display',
      data: { type: 'portfolio_summary' }
    };
  }
  
  private static getBiggestHolding(
    holdings: Holding[], 
    displayCurrency: CurrencyCode,
    exchangeRates: ExchangeRates | null
  ): QuickQueryResult {
    if (holdings.length === 0) {
      return { success: true, message: 'No holdings found' };
    }
    
    const holdingValues = holdings.map(h => {
      const result = calculatePortfolioValue([h], displayCurrency, exchangeRates);
      return {
        ...h,
        value: result.totalValue
      };
    });
    
    const biggest = holdingValues.reduce((max, h) => h.value > max.value ? h : max);
    const totalValue = holdingValues.reduce((sum, h) => sum + h.value, 0);
    const percentage = totalValue > 0 ? (biggest.value / totalValue) * 100 : 0;
    
    return {
      success: true,
      message: `🏆 **Biggest Holding**\n\n${biggest.symbol} (${biggest.name})\nValue: ${Math.round(biggest.value).toLocaleString()} ${displayCurrency}\nPercentage: ${percentage.toFixed(1)}%`,
      action: 'highlight',
      data: { symbol: biggest.symbol, type: 'biggest_holding' }
    };
  }
  
  private static getAllocationGaps(
    holdings: Holding[], 
    displayCurrency: CurrencyCode,
    exchangeRates: ExchangeRates | null,
    financialProfile?: any
  ): QuickQueryResult {
    const portfolioResult = calculatePortfolioValue(holdings, displayCurrency, exchangeRates);
    const totalValue = portfolioResult.totalValue;
    const categories = this.groupByCategory(holdings);
    
    // Get targets from financial profile or use defaults
    const targets = {
      Core: financialProfile?.coreTarget || 25,
      Growth: financialProfile?.growthTarget || 55,
      Hedge: financialProfile?.hedgeTarget || 10,
      Liquidity: financialProfile?.liquidityTarget || 10
    };
    
    const gaps = Object.entries(categories).map(([category, categoryHoldings]) => {
      const categoryResult = calculatePortfolioValue(categoryHoldings, displayCurrency, exchangeRates);
      const categoryValue = categoryResult.totalValue;
      const currentPercent = totalValue > 0 ? (categoryValue / totalValue) * 100 : 0;
      const targetPercent = targets[category as keyof typeof targets] || 0;
      const gap = currentPercent - targetPercent;
      
      return {
        category,
        current: currentPercent,
        target: targetPercent,
        gap,
        gapAmount: (gap / 100) * totalValue
      };
    }).filter(gap => Math.abs(gap.gap) > 2); // Only show gaps > 2%
    
    if (gaps.length === 0) {
      return { 
        success: true, 
        message: '✅ All allocations are within target ranges!',
        data: { type: 'allocation_gaps' }
      };
    }
    
    const gapText = gaps.map(gap => {
      const direction = gap.gap > 0 ? 'over' : 'under';
      const action = gap.gap > 0 ? 'Consider reducing' : 'Consider adding';
      return `${gap.category}: ${gap.current.toFixed(1)}% (${direction} by ${Math.abs(gap.gap).toFixed(1)}%)\n   ${action} ${Math.round(Math.abs(gap.gapAmount)).toLocaleString()} ${displayCurrency}`;
    }).join('\n\n');
    
    return {
      success: true,
      message: `🎯 **Allocation Gaps**\n\n${gapText}`,
      action: 'display',
      data: { type: 'allocation_gaps' }
    };
  }
  
  private static getTotalValue(
    holdings: Holding[], 
    displayCurrency: CurrencyCode,
    exchangeRates: ExchangeRates | null
  ): QuickQueryResult {
    const portfolioResult = calculatePortfolioValue(holdings, displayCurrency, exchangeRates);
    const totalValue = portfolioResult.totalValue;
    
    return {
      success: true,
      message: `💰 **Total Portfolio Value**\n\n${Math.round(totalValue).toLocaleString()} ${displayCurrency}`,
      action: 'display',
      data: { type: 'total_value' }
    };
  }
  
  private static getCategoryHoldings(
    query: string, 
    holdings: Holding[], 
    displayCurrency: CurrencyCode,
    exchangeRates: ExchangeRates | null
  ): QuickQueryResult {
    const category = query.toLowerCase().includes('core') ? 'Core' :
                    query.toLowerCase().includes('growth') ? 'Growth' :
                    query.toLowerCase().includes('hedge') ? 'Hedge' :
                    query.toLowerCase().includes('liquidity') ? 'Liquidity' : null;
    
    if (!category) {
      return { success: false, message: 'Category not recognized' };
    }
    
    const categoryHoldings = holdings.filter(h => h.category === category);
    const categoryResult = calculatePortfolioValue(categoryHoldings, displayCurrency, exchangeRates);
    const totalValue = categoryResult.totalValue;
    
    if (categoryHoldings.length === 0) {
      return { success: true, message: `No ${category} holdings found` };
    }
    
    const holdingsList = categoryHoldings.map(h => {
      const holdingResult = calculatePortfolioValue([h], displayCurrency, exchangeRates);
      const value = holdingResult.totalValue;
      return `• ${h.symbol}: ${value.toLocaleString()} ${displayCurrency}`;
    }).join('\n');
    
    return {
      success: true,
      message: `📂 **${category} Holdings**\n\nTotal: ${totalValue.toLocaleString()} ${displayCurrency}\n\n${holdingsList}`,
      action: 'filter',
      data: { category }
    };
  }
  
  private static groupByCategory(holdings: Holding[]): Record<string, Holding[]> {
    return holdings.reduce((groups, holding) => {
      const category = holding.category || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push(holding);
      return groups;
    }, {} as Record<string, Holding[]>);
  }
} 