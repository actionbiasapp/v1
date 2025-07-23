import { 
  calculateWeightedAverage, 
  calculateUnitsFromTotal, 
  calculateTotalFromUnits, 
  findExistingHolding,
  WeightedAverageResult 
} from '../../app/lib/weightedAverage';
import { config } from '../../app/lib/config';

// Mock fetch globally
global.fetch = jest.fn();

// Mock config
jest.mock('../../app/lib/config', () => ({
  config: {
    BASE_URL: 'http://localhost:3000'
  }
}));

describe('weightedAverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('calculateUnitsFromTotal', () => {
    it('should calculate units correctly', () => {
      expect(calculateUnitsFromTotal(1000, 50)).toBe(20);
      expect(calculateUnitsFromTotal(500, 25)).toBe(20);
      expect(calculateUnitsFromTotal(0, 50)).toBe(0);
    });

    it('should return 0 for invalid unit price', () => {
      expect(calculateUnitsFromTotal(1000, 0)).toBe(0);
      expect(calculateUnitsFromTotal(1000, -10)).toBe(0);
    });
  });

  describe('calculateTotalFromUnits', () => {
    it('should calculate total correctly', () => {
      expect(calculateTotalFromUnits(10, 50)).toBe(500);
      expect(calculateTotalFromUnits(5, 25)).toBe(125);
      expect(calculateTotalFromUnits(0, 50)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(calculateTotalFromUnits(-5, 25)).toBe(-125);
      expect(calculateTotalFromUnits(5, -25)).toBe(-125);
    });
  });

  describe('findExistingHolding', () => {
    it('should find existing holding by symbol', async () => {
      const mockHoldings = [
        { symbol: 'AAPL', quantity: 10, unitPrice: 150 },
        { symbol: 'GOOGL', quantity: 5, unitPrice: 2500 }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHoldings
      });

      const result = await findExistingHolding('AAPL');
      expect(result).toEqual(mockHoldings[0]);
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/holdings');
    });

    it('should handle case-insensitive search', async () => {
      const mockHoldings = [
        { symbol: 'AAPL', quantity: 10, unitPrice: 150 }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHoldings
      });

      const result = await findExistingHolding('aapl');
      expect(result).toEqual(mockHoldings[0]);
    });

    it('should return null when holding not found', async () => {
      const mockHoldings = [
        { symbol: 'AAPL', quantity: 10, unitPrice: 150 }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHoldings
      });

      const result = await findExistingHolding('MSFT');
      expect(result).toBeNull();
    });

    it('should return null on API error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });

      const result = await findExistingHolding('AAPL');
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await findExistingHolding('AAPL');
      expect(result).toBeNull();
    });
  });

  describe('calculateWeightedAverage', () => {
    const mockExchangeRates = {
      USD_TO_SGD: 1.28,
      SGD_TO_USD: 0.78125,
      USD_TO_INR: 85.50,
      INR_TO_USD: 0.0117,
      SGD_TO_INR: 66.80,
      INR_TO_SGD: 0.0150
    };

    beforeEach(() => {
      // Mock exchange rates API
      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/exchange-rates')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ rates: mockExchangeRates })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      });
    });

    it('should create new holding when no existing holding found', async () => {
      const result = await calculateWeightedAverage('AAPL', 10, 150, 1500, 'SGD');
      
      expect(result.isNewHolding).toBe(true);
      expect(result.newQuantity).toBe(10);
      expect(result.newAvgCostBasis).toBe(150);
      expect(result.newTotalInvested).toBe(1500);
      expect(result.existingData).toBeUndefined();
    });

    it('should calculate weighted average for existing holding', async () => {
      const mockHoldings = [
        { 
          symbol: 'AAPL', 
          quantity: 5, 
          unitPrice: 140, 
          valueUSD: 700,
          currentUnitPrice: 140
        }
      ];

      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/exchange-rates')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ rates: mockExchangeRates })
          });
        }
        if (url.includes('/api/holdings')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHoldings
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      });

      const result = await calculateWeightedAverage('AAPL', 5, 160, 800, 'SGD');
      
      expect(result.isNewHolding).toBe(false);
      expect(result.newQuantity).toBe(10); // 5 + 5
      expect(result.newAvgCostBasis).toBe(150); // (700 + 800) / 10
      expect(result.newTotalInvested).toBe(1500); // 700 + 800
      expect(result.existingData).toBeDefined();
      expect(result.existingData?.currentQuantity).toBe(5);
    });

    it('should handle existing holding with zero quantity', async () => {
      const mockHoldings = [
        { 
          symbol: 'AAPL', 
          quantity: 0, 
          unitPrice: 0, 
          valueUSD: 0,
          currentUnitPrice: 0
        }
      ];

      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/exchange-rates')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ rates: mockExchangeRates })
          });
        }
        if (url.includes('/api/holdings')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHoldings
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      });

      const result = await calculateWeightedAverage('AAPL', 10, 150, 1500, 'SGD');
      
      expect(result.isNewHolding).toBe(false);
      expect(result.newQuantity).toBe(10);
      expect(result.newAvgCostBasis).toBe(150);
      expect(result.newTotalInvested).toBe(1500);
      expect(result.existingData?.currentQuantity).toBe(0);
    });

    it('should handle currency conversion correctly', async () => {
      const mockHoldings = [
        { 
          symbol: 'AAPL', 
          quantity: 5, 
          unitPrice: 140, 
          valueUSD: 700,
          currentUnitPrice: 140
        }
      ];

      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/exchange-rates')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ rates: mockExchangeRates })
          });
        }
        if (url.includes('/api/holdings')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHoldings
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      });

      const result = await calculateWeightedAverage('AAPL', 5, 160, 800, 'SGD');
      
      // USD to SGD conversion should be applied
      expect(result.newAvgCostBasis).toBe(150);
      expect(result.newTotalInvested).toBe(1500);
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await calculateWeightedAverage('AAPL', 10, 150, 1500, 'SGD');
      
      expect(result.isNewHolding).toBe(true);
      expect(result.newQuantity).toBe(10);
      expect(result.newAvgCostBasis).toBe(150);
      expect(result.newTotalInvested).toBe(1500);
    });

    it('should handle holdings API failure', async () => {
      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/exchange-rates')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ rates: mockExchangeRates })
          });
        }
        if (url.includes('/api/holdings')) {
          return Promise.resolve({
            ok: false,
            status: 500
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      });

      const result = await calculateWeightedAverage('AAPL', 10, 150, 1500, 'SGD');
      
      expect(result.isNewHolding).toBe(true);
      expect(result.newQuantity).toBe(10);
      expect(result.newAvgCostBasis).toBe(150);
      expect(result.newTotalInvested).toBe(1500);
    });

    it('should round quantities and prices correctly', async () => {
      const mockHoldings = [
        { 
          symbol: 'AAPL', 
          quantity: 3.333, 
          unitPrice: 140.123, 
          valueUSD: 466.67,
          currentUnitPrice: 140.123
        }
      ];

      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/exchange-rates')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ rates: mockExchangeRates })
          });
        }
        if (url.includes('/api/holdings')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHoldings
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      });

      const result = await calculateWeightedAverage('AAPL', 2.667, 160.456, 428.33, 'SGD');
      
      expect(result.newQuantity).toBe(6); // 3.333 + 2.667 = 6
      expect(result.newAvgCostBasis).toBe(149.17); // Rounded to 2 decimal places
      expect(result.newTotalInvested).toBe(895.00); // Rounded to 2 decimal places
    });

    it('should select best match when multiple holdings exist', async () => {
      const mockHoldings = [
        { 
          symbol: 'AAPL', 
          quantity: 5, 
          unitPrice: 140, 
          valueUSD: 700,
          currentUnitPrice: 140
        },
        { 
          symbol: 'AAPL', 
          quantity: 10, 
          unitPrice: 150, 
          valueUSD: 1500,
          currentUnitPrice: 150
        }
      ];

      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/exchange-rates')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ rates: mockExchangeRates })
          });
        }
        if (url.includes('/api/holdings')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockHoldings
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      });

      const result = await calculateWeightedAverage('AAPL', 5, 160, 800, 'SGD');
      
      // Should select the holding with higher valueUSD (1500 > 700)
      expect(result.existingData?.currentQuantity).toBe(10);
      expect(result.newQuantity).toBe(15); // 10 + 5
    });
  });
}); 