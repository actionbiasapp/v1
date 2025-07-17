// Sample Data Manager - Centralized fallback data for development and API failures
import { Holding } from '@/app/lib/types/shared';

export const sampleHoldings: Holding[] = [
  // Core Holdings (25% target)
  { id: '1', symbol: 'VUAA.L', name: 'Vanguard S&P 500 UCITS ETF', value: 45000, valueSGD: 45000, valueINR: 2857500, valueUSD: 33300, entryCurrency: 'SGD', category: 'Core', location: 'IBKR' },
  { id: '2', symbol: 'IWDA.L', name: 'iShares Core MSCI World UCITS ETF', value: 35000, valueSGD: 35000, valueINR: 2222500, valueUSD: 25900, entryCurrency: 'SGD', category: 'Core', location: 'IBKR' },
  { id: '3', symbol: 'ES3.SI', name: 'STI ETF', value: 25000, valueSGD: 25000, valueINR: 1587500, valueUSD: 18500, entryCurrency: 'SGD', category: 'Core', location: 'DBS Bank' },
  
  // Growth Holdings (55% target)
  { id: '4', symbol: 'TSLA', name: 'Tesla Inc', value: 65000, valueSGD: 65000, valueINR: 4127500, valueUSD: 48100, entryCurrency: 'USD', category: 'Growth', location: 'IBKR', quantity: 180, costBasis: 278 },
  { id: '5', symbol: 'NVDA', name: 'NVIDIA Corporation', value: 45000, valueSGD: 45000, valueINR: 2857500, valueUSD: 33300, entryCurrency: 'USD', category: 'Growth', location: 'IBKR', quantity: 110, costBasis: 415 },
  { id: '6', symbol: 'MSFT', name: 'Microsoft Corporation', value: 40000, valueSGD: 40000, valueINR: 2540000, valueUSD: 29600, entryCurrency: 'USD', category: 'Growth', location: 'IBKR', quantity: 95, costBasis: 378 },
  { id: '7', symbol: 'ASML', name: 'ASML Holding NV', value: 35000, valueSGD: 35000, valueINR: 2222500, valueUSD: 25900, entryCurrency: 'EUR', category: 'Growth', location: 'IBKR' },
  { id: '8', symbol: 'TCS.NS', name: 'Tata Consultancy Services', value: 42000, valueSGD: 42000, valueINR: 2667000, valueUSD: 31080, entryCurrency: 'INR', category: 'Growth', location: 'ICICI Direct' },
  { id: '9', symbol: 'INFY.NS', name: 'Infosys Limited', value: 28000, valueSGD: 28000, valueINR: 1778000, valueUSD: 20720, entryCurrency: 'INR', category: 'Growth', location: 'ICICI Direct' },
  { id: '10', symbol: 'RELIANCE.NS', name: 'Reliance Industries', value: 25000, valueSGD: 25000, valueINR: 1587500, valueUSD: 18500, entryCurrency: 'INR', category: 'Growth', location: 'ICICI Direct' },
  
  // Hedge Holdings (10% target)
  { id: '11', symbol: 'BTC', name: 'Bitcoin', value: 35000, valueSGD: 35000, valueINR: 2222500, valueUSD: 25900, entryCurrency: 'USD', category: 'Hedge', location: 'CoinGecko', quantity: 0.85 },
  { id: '12', symbol: 'ETH', name: 'Ethereum', value: 18000, valueSGD: 18000, valueINR: 1143000, valueUSD: 13320, entryCurrency: 'USD', category: 'Hedge', location: 'CoinGecko', quantity: 7.2 },
  { id: '13', symbol: 'PAXG', name: 'PAX Gold', value: 12000, valueSGD: 12000, valueINR: 762000, valueUSD: 8880, entryCurrency: 'USD', category: 'Hedge', location: 'CoinGecko' },
  
  // Liquidity Holdings (10% target)
  { id: '14', symbol: 'SGD Cash', name: 'Singapore Dollar Cash', value: 15000, valueSGD: 15000, valueINR: 952500, valueUSD: 11100, entryCurrency: 'SGD', category: 'Liquidity', location: 'DBS Bank' },
  { id: '15', symbol: 'USD Cash', name: 'US Dollar Cash', value: 8000, valueSGD: 8000, valueINR: 508000, valueUSD: 5920, entryCurrency: 'USD', category: 'Liquidity', location: 'Standard Chartered' },
  { id: '16', symbol: 'INR Cash', name: 'Indian Rupee Cash', value: 5000, valueSGD: 5000, valueINR: 317500, valueUSD: 3700, entryCurrency: 'INR', category: 'Liquidity', location: 'ICICI Bank' },
  { id: '17', symbol: 'USDGLO', name: 'USD Global Coin', value: 7000, valueSGD: 7000, valueINR: 444500, valueUSD: 5180, entryCurrency: 'USD', category: 'Liquidity', location: 'Aave' },
  { id: '18', symbol: 'USDT', name: 'Tether USD', value: 12000, valueSGD: 12000, valueINR: 762000, valueUSD: 8880, entryCurrency: 'USD', category: 'Liquidity', location: 'Aave' },
  { id: '19', symbol: 'USDC', name: 'USD Coin', value: 3000, valueSGD: 3000, valueINR: 190500, valueUSD: 2220, entryCurrency: 'SGD', category: 'Liquidity', location: 'Binance' }
];

// Sample fallback data for when API calls fail
export const sampleFallbackData = {
  intelligence: {
    statusIntelligence: {
      fiProgress: "48.7% to first million",
      urgentAction: "Max out SRS by Dec 31",
      deadline: "175 days remaining"
    },
    actionIntelligence: [
      {
        id: 'srs-urgent',
        type: 'urgent',
        problem: 'Missing $8,500 SRS tax savings',
        solution: 'Contribute $35,700 to SRS by Dec 31',
        benefit: 'Save $8,500 in taxes',
        timeline: 'Deadline: Dec 31, 2025',
        actionText: 'Setup SRS',
        isClickable: true
      }
    ],
    allocationIntelligence: [
      { name: 'Core', status: 'perfect' as const, callout: 'Perfect allocation' },
      { name: 'Growth', status: 'underweight' as const, callout: 'Add $15k needed' },
      { name: 'Hedge', status: 'excess' as const, callout: 'Trim $8k excess' },
      { name: 'Liquidity', status: 'perfect' as const, callout: 'Perfect allocation' }
    ]
  },
  
  taxIntelligence: {
    srsOptimization: {
      remainingRoom: 35700,
      taxSavings: 8500,
      daysToDeadline: 175,
      monthlyTarget: 2975,
      urgencyLevel: 'medium' as const,
      maxContribution: 35700,
      currentContributions: 0,
      taxBracket: 15
    },
    opportunityCost: {
      monthlyPotentialSavings: 708,
      actionMessage: "Start monthly SRS to capture $8,500 benefit",
      urgencyMessage: "Missing potential tax savings each month"
    },
    employmentPassAdvantage: {
      srsLimitAdvantage: 20700,
      additionalTaxSavings: 5000,
      vsComparison: "Additional savings vs Citizens/PRs"
    }
  }
};

// Utility function to validate holdings data
export function validateHoldings(data: any): data is Holding[] {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => 
    item &&
    typeof item.id === 'string' &&
    typeof item.symbol === 'string' &&
    typeof item.name === 'string' &&
    typeof item.valueSGD === 'number' &&
    typeof item.category === 'string' &&
    typeof item.location === 'string'
  );
}

// Utility function to get fallback data when API fails
export function getFallbackData(dataType: 'holdings' | 'intelligence' | 'taxIntelligence') {
  switch (dataType) {
    case 'holdings':
      return sampleHoldings;
    case 'intelligence':
      return sampleFallbackData.intelligence;
    case 'taxIntelligence':
      return sampleFallbackData.taxIntelligence;
    default:
      return null;
  }
}

// Calculate total portfolio value for sample data
export function getSamplePortfolioValue(): number {
  return sampleHoldings.reduce((sum, holding) => sum + holding.valueSGD, 0);
}

export default {
  sampleHoldings,
  sampleFallbackData,
  validateHoldings,
  getFallbackData,
  getSamplePortfolioValue
};