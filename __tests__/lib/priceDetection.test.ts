import { PriceDetectionService, PriceDetectionResult } from '../../app/lib/priceDetection';
import { config } from '../../app/lib/config';

// Mock fetch globally
global.fetch = jest.fn();

// Mock config
jest.mock('../../app/lib/config', () => ({
  config: {
    FMP_API_KEY: 'test-fmp-key',
    BASE_URL: 'http://localhost:3000'
  }
}));

describe('PriceDetectionService', () => {
  let service: PriceDetectionService;

  beforeEach(() => {
    service = new PriceDetectionService();
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('constructor', () => {
    it('should initialize with FMP API key', () => {
      expect(service).toBeInstanceOf(PriceDetectionService);
    });

    it('should warn when FMP API key is missing', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Temporarily mock config without FMP_API_KEY
      jest.doMock('../../app/lib/config', () => ({
        config: {
          FMP_API_KEY: '',
          BASE_URL: 'http://localhost:3000'
        }
      }));

      new PriceDetectionService();
      expect(consoleSpy).toHaveBeenCalledWith('FMP_API_KEY is not set. Price detection for stocks will fail.');
      
      consoleSpy.mockRestore();
    });
  });

  describe('detectPriceSource', () => {
    describe('crypto asset type', () => {
      it('should detect crypto price successfully', async () => {
        const mockCryptoData = {
          bitcoin: { usd: 45000 }
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCryptoData
        });

        const result = await service.detectPriceSource('BTC', 'crypto');

        expect(result).toEqual({
          symbol: 'BTC',
          supportsAutoPricing: true,
          source: 'coingecko',
          currentPrice: 45000,
          currency: 'USD',
          confidence: 'high',
          companyName: 'Bitcoin',
          assetType: 'crypto'
        });
        expect(fetch).toHaveBeenCalledWith(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        );
      });

      it('should handle crypto API failure gracefully', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

        const result = await service.detectPriceSource('BTC', 'crypto');

        expect(result).toEqual({
          symbol: 'BTC',
          supportsAutoPricing: false,
          source: 'manual',
          currency: 'USD',
          confidence: 'low',
          assetType: 'crypto'
        });
      });

      it('should handle unknown crypto symbol', async () => {
        const mockCryptoData = {};

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCryptoData
        });

        const result = await service.detectPriceSource('UNKNOWN', 'crypto');

        expect(result).toEqual({
          symbol: 'UNKNOWN',
          supportsAutoPricing: false,
          source: 'manual',
          currency: 'USD',
          confidence: 'low',
          assetType: 'crypto'
        });
      });
    });

    describe('stock asset type', () => {
      it('should detect stock price successfully', async () => {
        const mockStockData = [{
          price: 150.50,
          symbol: 'AAPL'
        }];

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockStockData
        });

        const result = await service.detectPriceSource('AAPL', 'stock');

        expect(result).toEqual({
          symbol: 'AAPL',
          supportsAutoPricing: true,
          source: 'fmp',
          currentPrice: 150.50,
          currency: 'USD',
          confidence: 'high',
          assetType: 'stock'
        });
        expect(fetch).toHaveBeenCalledWith(
          'https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=test-fmp-key'
        );
      });

      it('should handle stock API failure gracefully', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

        const result = await service.detectPriceSource('AAPL', 'stock');

        expect(result).toEqual({
          symbol: 'AAPL',
          supportsAutoPricing: false,
          source: 'manual',
          currency: 'USD',
          confidence: 'low',
          assetType: 'stock'
        });
      });

      it('should handle empty stock data', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => []
        });

        const result = await service.detectPriceSource('AAPL', 'stock');

        expect(result).toEqual({
          symbol: 'AAPL',
          supportsAutoPricing: false,
          source: 'manual',
          currency: 'USD',
          confidence: 'low',
          assetType: 'stock'
        });
      });
    });

    describe('manual asset type', () => {
      it('should return manual configuration', async () => {
        const result = await service.detectPriceSource('CUSTOM', 'manual');

        expect(result).toEqual({
          symbol: 'CUSTOM',
          supportsAutoPricing: false,
          source: 'manual',
          currency: 'USD',
          confidence: 'low',
          assetType: 'manual'
        });
      });
    });

    describe('auto-detection (backward compatibility)', () => {
      it('should auto-detect stock symbol', async () => {
        const mockStockData = [{
          price: 150.50,
          symbol: 'AAPL'
        }];

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockStockData
        });

        const result = await service.detectPriceSource('AAPL');

        expect(result.source).toBe('fmp');
        expect(result.assetType).toBe('stock');
        expect(result.supportsAutoPricing).toBe(true);
      });

      it('should auto-detect crypto symbol', async () => {
        const mockCryptoData = {
          bitcoin: { usd: 45000 }
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockCryptoData
        });

        const result = await service.detectPriceSource('BTC');

        expect(result.source).toBe('coingecko');
        expect(result.assetType).toBe('crypto');
        expect(result.supportsAutoPricing).toBe(true);
      });

      it('should fallback to manual for unknown symbols', async () => {
        const result = await service.detectPriceSource('UNKNOWN');

        expect(result.source).toBe('manual');
        expect(result.assetType).toBe('manual');
        expect(result.supportsAutoPricing).toBe(false);
      });
    });

    describe('enhanced data fetching', () => {
      it('should enhance stock data with company profile', async () => {
        const mockStockData = [{
          price: 150.50,
          symbol: 'AAPL'
        }];

        const mockProfileData = [{
          companyName: 'Apple Inc.',
          industry: 'Technology'
        }];

        const mockHoldingsData = [
          {
            id: '1',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            location: 'US',
            valueUSD: 1000
          }
        ];

        (fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockStockData
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockProfileData
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockHoldingsData
          });

        const result = await service.detectPriceSource('AAPL');

        expect(result.companyName).toBe('Apple Inc.');
        expect(result.industry).toBe('Technology');
        expect(result.existingHoldings).toEqual([
          {
            id: '1',
            name: 'Apple Inc.',
            location: 'US',
            valueUSD: 1000
          }
        ]);
      });

      it('should handle company profile fetch failure', async () => {
        const mockStockData = [{
          price: 150.50,
          symbol: 'AAPL'
        }];

        (fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockStockData
          })
          .mockRejectedValueOnce(new Error('Profile API Error'));

        const result = await service.detectPriceSource('AAPL');

        expect(result.companyName).toBeUndefined();
        expect(result.industry).toBeUndefined();
        expect(result.supportsAutoPricing).toBe(true);
      });

      it('should handle holdings fetch failure', async () => {
        const mockStockData = [{
          price: 150.50,
          symbol: 'AAPL'
        }];

        (fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockStockData
          })
          .mockResolvedValueOnce({
            ok: false
          });

        const result = await service.detectPriceSource('AAPL');

        expect(result.existingHoldings).toBeUndefined();
        expect(result.supportsAutoPricing).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should handle general errors gracefully', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('General error'));

        const result = await service.detectPriceSource('TEST');

        expect(result).toEqual({
          symbol: 'TEST',
          supportsAutoPricing: false,
          source: 'manual',
          currency: 'USD',
          confidence: 'low',
          error: 'General error',
          assetType: 'manual'
        });
      });

      it('should handle non-Error objects', async () => {
        (fetch as jest.Mock).mockRejectedValue('String error');

        const result = await service.detectPriceSource('TEST');

        expect(result.error).toBe('Detection failed');
      });
    });
  });

  describe('crypto symbol mapping', () => {
    it('should map common crypto symbols correctly', async () => {
      const testCases = [
        { symbol: 'BTC', expectedId: 'bitcoin' },
        { symbol: 'ETH', expectedId: 'ethereum' },
        { symbol: 'ADA', expectedId: 'cardano' },
        { symbol: 'DOT', expectedId: 'polkadot' },
        { symbol: 'SOL', expectedId: 'solana' },
        { symbol: 'AVAX', expectedId: 'avalanche-2' },
        { symbol: 'MATIC', expectedId: 'matic-network' },
        { symbol: 'LINK', expectedId: 'chainlink' },
        { symbol: 'UNI', expectedId: 'uniswap' },
        { symbol: 'AAVE', expectedId: 'aave' }
      ];

      for (const testCase of testCases) {
        const mockData = {
          [testCase.expectedId]: { usd: 100 }
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        });

        const result = await service.detectPriceSource(testCase.symbol, 'crypto');
        expect(result.source).toBe('coingecko');
        expect(result.supportsAutoPricing).toBe(true);
      }
    });

    it('should handle unknown crypto symbols', async () => {
      const mockData = {
        unknown: { usd: 100 }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await service.detectPriceSource('UNKNOWN', 'crypto');
      expect(result.source).toBe('manual');
      expect(result.supportsAutoPricing).toBe(false);
    });
  });

  describe('crypto display names', () => {
    it('should return correct display names for known cryptos', async () => {
      const mockData = {
        bitcoin: { usd: 45000 }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await service.detectPriceSource('BTC', 'crypto');
      expect(result.companyName).toBe('Bitcoin');
    });

    it('should return uppercase symbol for unknown cryptos', async () => {
      const mockData = {
        unknown: { usd: 100 }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await service.detectPriceSource('UNKNOWN', 'crypto');
      expect(result.companyName).toBe('UNKNOWN');
    });
  });
}); 