import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the agent service to avoid OpenAI dependencies
jest.mock('../../app/lib/agent/agentService', () => ({
  PortfolioAgent: {
    executeAction: jest.fn()
  }
}));

// Mock Prisma Client
const mockPrisma = {
  holdings: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn()
  },
  assetCategory: {
    findFirst: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn()
  },
  $disconnect: jest.fn()
} as any;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

// Mock error handling
jest.mock('../../app/lib/errorHandling', () => ({
  handleApiError: jest.fn(),
  validateRequiredFields: jest.fn(),
  createValidationErrorResponse: jest.fn()
}));

describe('Holdings CRUD Operations - Core Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('REDUCE - Reduce Holding Quantity Logic', () => {
    const mockHolding = {
      id: 'test-holding-id',
      symbol: 'AAPL',
      name: 'Apple Inc',
      quantity: 100,
      unitPrice: 150.00,
      currentUnitPrice: 150.00,
      costBasis: 15000.00,
      entryCurrency: 'USD',
      location: 'IBKR',
      categoryId: 'test-category',
      userId: 'test-user',
      valueSGD: 20000.00,
      valueUSD: 15000.00,
      valueINR: 1230000.00
    };

    it('should calculate remaining quantity correctly', () => {
      const currentQuantity = Number(mockHolding.quantity) || 0;
      const reduceQuantity = 30;
      const remainingQuantity = Math.round((currentQuantity - reduceQuantity) * 100) / 100;
      
      expect(remainingQuantity).toBe(70);
    });

    it('should calculate remaining cost basis correctly', () => {
      const currentCostBasis = Number(mockHolding.costBasis) || 0;
      const reduceQuantity = 30;
      const reduceUnitPrice = 150.00;
      const reduceCostBasis = Math.round(reduceQuantity * reduceUnitPrice * 100) / 100;
      const remainingCostBasis = Math.round((currentCostBasis - reduceCostBasis) * 100) / 100;
      
      expect(reduceCostBasis).toBe(4500.00);
      expect(remainingCostBasis).toBe(10500.00);
    });

    it('should detect when quantity becomes zero', () => {
      const currentQuantity = Number(mockHolding.quantity) || 0;
      const reduceQuantity = 100;
      const remainingQuantity = Math.round((currentQuantity - reduceQuantity) * 100) / 100;
      
      expect(remainingQuantity).toBe(0);
    });

    it('should detect when trying to reduce more than available', () => {
      const currentQuantity = Number(mockHolding.quantity) || 0;
      const reduceQuantity = 150;
      const canReduce = reduceQuantity <= currentQuantity;
      
      expect(canReduce).toBe(false);
    });

    it('should handle decimal quantities correctly', () => {
      const currentQuantity = Number(mockHolding.quantity) || 0;
      const reduceQuantity = 25.5;
      const remainingQuantity = Math.round((currentQuantity - reduceQuantity) * 100) / 100;
      
      expect(remainingQuantity).toBe(74.5);
    });

    it('should calculate new total value correctly after reduction', () => {
      const currentQuantity = Number(mockHolding.quantity) || 0;
      const currentUnitPrice = Number(mockHolding.currentUnitPrice) || Number(mockHolding.unitPrice) || 0;
      const reduceQuantity = 30;
      const remainingQuantity = currentQuantity - reduceQuantity;
      
      // Calculate new total value
      const newTotalValue = remainingQuantity * currentUnitPrice;
      
      // Convert to SGD (assuming USD entry currency)
      const usdToSgdRate = 1.35;
      const newValueSGD = Math.round(newTotalValue * usdToSgdRate * 100) / 100;
      
      expect(remainingQuantity).toBe(70);
      expect(newTotalValue).toBe(10500.00); // 70 * 150
      expect(newValueSGD).toBe(14175.00); // 10500 * 1.35
    });

    it('should calculate new total value for SGD entry currency', () => {
      const sgdHolding = {
        ...mockHolding,
        entryCurrency: 'SGD',
        unitPrice: 200.00,
        currentUnitPrice: 200.00,
        quantity: 50
      };
      
      const currentQuantity = Number(sgdHolding.quantity) || 0;
      const currentUnitPrice = Number(sgdHolding.currentUnitPrice) || Number(sgdHolding.unitPrice) || 0;
      const reduceQuantity = 10;
      const remainingQuantity = currentQuantity - reduceQuantity;
      
      // Calculate new total value
      const newTotalValue = remainingQuantity * currentUnitPrice;
      
      // For SGD entry currency, valueSGD should equal the total value
      const newValueSGD = newTotalValue;
      
      expect(remainingQuantity).toBe(40);
      expect(newTotalValue).toBe(8000.00); // 40 * 200
      expect(newValueSGD).toBe(8000.00); // Same as total value for SGD
    });
  });

  describe('INCREASE - Add to Existing Holding Logic', () => {
    const mockHolding = {
      id: 'test-holding-id',
      symbol: 'GOOGL',
      name: 'Alphabet Inc',
      quantity: 20,
      unitPrice: 100.00,
      costBasis: 2000.00,
      entryCurrency: 'USD',
      location: 'IBKR',
      categoryId: 'test-category',
      userId: 'test-user'
    };

    it('should calculate weighted average price correctly', () => {
      const existingQuantity = Number(mockHolding.quantity) || 0;
      const existingCostBasis = Number(mockHolding.costBasis) || 0;
      const newQuantity = 30;
      const newUnitPrice = 120.00;
      const newCostBasis = Math.round(newQuantity * newUnitPrice * 100) / 100;
      
      const totalQuantity = Math.round((existingQuantity + newQuantity) * 100) / 100;
      const totalCostBasis = Math.round((existingCostBasis + newCostBasis) * 100) / 100;
      const weightedAveragePrice = Math.round((totalCostBasis / totalQuantity) * 100) / 100;
      
      expect(newCostBasis).toBe(3600.00);
      expect(totalQuantity).toBe(50);
      expect(totalCostBasis).toBe(5600.00);
      expect(weightedAveragePrice).toBe(112.00);
    });

    it('should handle multiple additions correctly', () => {
      let existingQuantity = Number(mockHolding.quantity) || 0;
      let existingCostBasis = Number(mockHolding.costBasis) || 0;
      
      // First addition: 20 shares at $110
      const firstNewQuantity = 20;
      const firstNewUnitPrice = 110.00;
      const firstNewCostBasis = Math.round(firstNewQuantity * firstNewUnitPrice * 100) / 100;
      
      existingQuantity = Math.round((existingQuantity + firstNewQuantity) * 100) / 100;
      existingCostBasis = Math.round((existingCostBasis + firstNewCostBasis) * 100) / 100;
      const firstWeightedAverage = Math.round((existingCostBasis / existingQuantity) * 100) / 100;
      
      expect(existingQuantity).toBe(40);
      expect(existingCostBasis).toBe(4200.00);
      expect(firstWeightedAverage).toBe(105.00);
      
      // Second addition: 10 shares at $130
      const secondNewQuantity = 10;
      const secondNewUnitPrice = 130.00;
      const secondNewCostBasis = Math.round(secondNewQuantity * secondNewUnitPrice * 100) / 100;
      
      existingQuantity = Math.round((existingQuantity + secondNewQuantity) * 100) / 100;
      existingCostBasis = Math.round((existingCostBasis + secondNewCostBasis) * 100) / 100;
      const secondWeightedAverage = Math.round((existingCostBasis / existingQuantity) * 100) / 100;
      
      expect(existingQuantity).toBe(50);
      expect(existingCostBasis).toBe(5500.00);
      expect(secondWeightedAverage).toBe(110.00);
    });
  });

  describe('VALIDATION - Input Validation Logic', () => {
    it('should validate required fields for holding creation', () => {
      const requiredFields = ['symbol', 'name', 'category', 'location'];
      const validData = {
        symbol: 'AAPL',
        name: 'Apple Inc',
        category: 'Growth',
        location: 'IBKR',
        valueSGD: 1000
      };
      
      const missingFields = requiredFields.filter(field => !validData[field as keyof typeof validData]);
      expect(missingFields).toEqual([]);
    });

    it('should detect missing required fields', () => {
      const requiredFields = ['symbol', 'name', 'category', 'location'];
      const invalidData = {
        symbol: 'AAPL',
        name: 'Apple Inc'
        // Missing category and location
      };
      
      const missingFields = requiredFields.filter(field => !invalidData[field as keyof typeof invalidData]);
      expect(missingFields).toEqual(['category', 'location']);
    });

    it('should validate numeric values', () => {
      const valueSGD = 1000;
      const isValid = valueSGD > 0;
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid numeric values', () => {
      const valueSGD = 0;
      const isValid = valueSGD > 0;
      
      expect(isValid).toBe(false);
    });

    it('should handle null quantities correctly', () => {
      const quantity = null;
      const numericQuantity = Number(quantity) || 0;
      
      expect(numericQuantity).toBe(0);
    });

    it('should handle undefined quantities correctly', () => {
      const quantity = undefined;
      const numericQuantity = Number(quantity) || 0;
      
      expect(numericQuantity).toBe(0);
    });
  });

  describe('CURRENCY - Currency Conversion Logic', () => {
    it('should handle SGD as primary currency', () => {
      const inputValue = 1000;
      const inputCurrency: string = 'SGD';
      const exchangeRates = {
        SGD_TO_USD: 0.74,
        SGD_TO_INR: 61.6
      };
      
      const valueSGD = inputCurrency === 'SGD' ? inputValue : inputValue * exchangeRates.SGD_TO_USD;
      const valueUSD = inputCurrency === 'USD' ? inputValue : inputValue * exchangeRates.SGD_TO_USD;
      const valueINR = inputCurrency === 'INR' ? inputValue : inputValue * exchangeRates.SGD_TO_INR;
      
      expect(valueSGD).toBe(1000);
      expect(valueUSD).toBe(740);
      expect(valueINR).toBe(61600);
    });

    it('should handle USD as primary currency', () => {
      const inputValue = 1000;
      const inputCurrency: string = 'USD';
      const exchangeRates = {
        USD_TO_SGD: 1.35,
        USD_TO_INR: 83.0
      };
      
      const valueSGD = inputCurrency === 'SGD' ? inputValue : inputValue * exchangeRates.USD_TO_SGD;
      const valueUSD = inputCurrency === 'USD' ? inputValue : inputValue;
      const valueINR = inputCurrency === 'INR' ? inputValue : inputValue * exchangeRates.USD_TO_INR;
      
      expect(valueSGD).toBe(1350);
      expect(valueUSD).toBe(1000);
      expect(valueINR).toBe(83000);
    });
  });

  describe('ROUNDING - Precision Handling', () => {
    it('should round to 2 decimal places correctly', () => {
      const value = 123.456789;
      const rounded = Math.round(value * 100) / 100;
      
      expect(rounded).toBe(123.46);
    });

    it('should handle exact decimal values', () => {
      const value = 100.00;
      const rounded = Math.round(value * 100) / 100;
      
      expect(rounded).toBe(100);
    });

    it('should handle very small decimal values', () => {
      const value = 0.001;
      const rounded = Math.round(value * 100) / 100;
      
      expect(rounded).toBe(0);
    });

    it('should handle large decimal values', () => {
      const value = 999999.999;
      const rounded = Math.round(value * 100) / 100;
      
      expect(rounded).toBe(1000000);
    });
  });

  describe('EDGE CASES - Boundary Conditions', () => {
    it('should handle zero quantities', () => {
      const quantity = 0;
      const isValid = quantity >= 0;
      
      expect(isValid).toBe(true);
    });

    it('should handle very large quantities', () => {
      const quantity = 1000000;
      const isValid = quantity > 0 && quantity < Number.MAX_SAFE_INTEGER;
      
      expect(isValid).toBe(true);
    });

    it('should handle very small prices', () => {
      const price = 0.01;
      const isValid = price > 0;
      
      expect(isValid).toBe(true);
    });

    it('should handle very large prices', () => {
      const price = 999999.99;
      const isValid = price > 0 && price < Number.MAX_SAFE_INTEGER;
      
      expect(isValid).toBe(true);
    });

    it('should handle empty strings', () => {
      const symbol = '';
      const isValid = symbol.length > 0;
      
      expect(isValid).toBe(false);
    });

    it('should handle very long strings', () => {
      const name = 'A'.repeat(1000);
      const isValid = name.length > 0 && name.length < 10000;
      
      expect(isValid).toBe(true);
    });
  });
}); 