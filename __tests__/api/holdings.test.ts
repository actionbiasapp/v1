import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/holdings/route';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    holdings: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn()
    },
    assetCategory: {
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }))
}));

// Mock error handling
jest.mock('../../app/lib/errorHandling', () => ({
  handleApiError: jest.fn(),
  validateRequiredFields: jest.fn(),
  createValidationErrorResponse: jest.fn()
}));

describe('/api/holdings', () => {
  let mockPrisma: any;
  let mockHandleApiError: jest.Mock;
  let mockValidateRequiredFields: jest.Mock;
  let mockCreateValidationErrorResponse: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    mockHandleApiError = require('../../app/lib/errorHandling').handleApiError;
    mockValidateRequiredFields = require('../../app/lib/errorHandling').validateRequiredFields;
    mockCreateValidationErrorResponse = require('../../app/lib/errorHandling').createValidationErrorResponse;
  });

  describe('GET /api/holdings', () => {
    it('should return formatted holdings', async () => {
      const mockHoldings = [
        {
          id: '1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          valueSGD: 1000,
          valueINR: 50000,
          valueUSD: 750,
          entryCurrency: 'SGD',
          category: { name: 'Technology' },
          location: 'US',
          quantity: 10,
          unitPrice: 100,
          assetType: 'stock',
          costBasis: 95,
          currentUnitPrice: 105,
          priceUpdated: new Date(),
          priceSource: 'fmp'
        }
      ];

      mockPrisma.holdings.findMany.mockResolvedValue(mockHoldings);

      const response = await GET();
      const data = await response.json();

      expect(mockPrisma.holdings.findMany).toHaveBeenCalledWith({
        include: {
          category: true,
        },
      });

      expect(data).toEqual([
        {
          id: '1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          valueSGD: 1000,
          valueINR: 50000,
          valueUSD: 750,
          entryCurrency: 'SGD',
          value: 1000,
          currentValue: 1000,
          category: 'Technology',
          location: 'US',
          quantity: 10,
          unitPrice: 100,
          assetType: 'stock',
          costBasis: 95,
          currentUnitPrice: 105,
          priceUpdated: expect.any(Date),
          priceSource: 'fmp'
        }
      ]);
    });

    it('should handle null values correctly', async () => {
      const mockHoldings = [
        {
          id: '1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          valueSGD: 1000,
          valueINR: 0,
          valueUSD: 0,
          entryCurrency: 'SGD',
          category: { name: 'Technology' },
          location: 'US',
          quantity: null,
          unitPrice: null,
          assetType: null,
          costBasis: null,
          currentUnitPrice: null,
          priceUpdated: null,
          priceSource: null
        }
      ];

      mockPrisma.holdings.findMany.mockResolvedValue(mockHoldings);

      const response = await GET();
      const data = await response.json();

      expect(data[0]).toEqual({
        id: '1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        valueINR: 0,
        valueUSD: 0,
        entryCurrency: 'SGD',
        value: 1000,
        currentValue: 1000,
        category: 'Technology',
        location: 'US',
        quantity: null,
        unitPrice: null,
        assetType: null,
        costBasis: null,
        currentUnitPrice: null,
        priceUpdated: null,
        priceSource: null
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.holdings.findMany.mockRejectedValue(error);

      await GET();

      expect(mockHandleApiError).toHaveBeenCalledWith(error, 'GET /api/holdings');
    });
  });

  describe('POST /api/holdings', () => {
    const createMockRequest = (body: any): NextRequest => {
      return {
        json: jest.fn().mockResolvedValue(body)
      } as any;
    };

    it('should create a new holding successfully', async () => {
      const requestBody = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        category: 'Technology',
        location: 'US',
        entryCurrency: 'SGD'
      };

      const mockUser = {
        id: 'default-user',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockCategory = {
        id: 'cat-1',
        name: 'Technology',
        targetPercentage: 25
      };

      const mockHolding = {
        id: 'holding-1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        valueINR: 0,
        valueUSD: 0,
        entryCurrency: 'SGD',
        location: 'US',
        category: mockCategory,
        quantity: null,
        unitPrice: null,
        assetType: null,
        costBasis: null
      };

      mockValidateRequiredFields.mockReturnValue({ isValid: true, missingFields: [] });
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.assetCategory.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.holdings.create.mockResolvedValue(mockHolding);

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(mockValidateRequiredFields).toHaveBeenCalledWith(requestBody, ['symbol', 'name', 'category', 'location']);
      expect(mockPrisma.holdings.create).toHaveBeenCalledWith({
        data: {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          valueSGD: 1000,
          valueINR: 0,
          valueUSD: 0,
          entryCurrency: 'SGD',
          location: 'US',
          categoryId: 'cat-1',
          userId: 'default-user',
          costBasis: null,
          quantity: null,
          unitPrice: null,
          currentUnitPrice: null,
          priceSource: null,
          assetType: null
        },
        include: {
          category: true
        }
      });

      expect(data).toEqual({
        message: 'Holding created successfully',
        holding: {
          id: 'holding-1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          valueSGD: 1000,
          valueINR: 0,
          valueUSD: 0,
          entryCurrency: 'SGD',
          value: 1000,
          currentValue: 1000,
          category: 'Technology',
          location: 'US',
          quantity: null,
          unitPrice: null,
          assetType: null,
          costBasis: null
        }
      });
      expect(response.status).toBe(201);
    });

    it('should create user if not exists', async () => {
      const requestBody = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        category: 'Technology',
        location: 'US'
      };

      const mockUser = {
        id: 'default-user',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockCategory = {
        id: 'cat-1',
        name: 'Technology'
      };

      const mockHolding = {
        id: 'holding-1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        valueINR: 0,
        valueUSD: 0,
        entryCurrency: 'SGD',
        location: 'US',
        category: mockCategory,
        quantity: null,
        unitPrice: null,
        assetType: null,
        costBasis: null
      };

      mockValidateRequiredFields.mockReturnValue({ isValid: true, missingFields: [] });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.assetCategory.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.holdings.create.mockResolvedValue(mockHolding);

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: 'default-user',
          email: 'test@example.com',
          name: 'Test User',
          country: 'Singapore',
          taxStatus: 'Employment Pass'
        }
      });
    });

    it('should create category if not exists', async () => {
      const requestBody = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        category: 'Technology',
        location: 'US'
      };

      const mockUser = {
        id: 'default-user',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockCategory = {
        id: 'cat-1',
        name: 'Technology',
        targetPercentage: 25
      };

      const mockHolding = {
        id: 'holding-1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        valueINR: 0,
        valueUSD: 0,
        entryCurrency: 'SGD',
        location: 'US',
        category: mockCategory,
        quantity: null,
        unitPrice: null,
        assetType: null,
        costBasis: null
      };

      mockValidateRequiredFields.mockReturnValue({ isValid: true, missingFields: [] });
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.assetCategory.findFirst.mockResolvedValue(null);
      mockPrisma.assetCategory.create.mockResolvedValue(mockCategory);
      mockPrisma.holdings.create.mockResolvedValue(mockHolding);

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(mockPrisma.assetCategory.create).toHaveBeenCalledWith({
        data: {
          name: 'Technology',
          targetPercentage: 25,
          userId: 'default-user',
          description: 'Technology investments'
        }
      });
    });

    it('should handle validation errors', async () => {
      const requestBody = {
        symbol: 'AAPL',
        name: 'Apple Inc.'
        // Missing required fields
      };

      mockValidateRequiredFields.mockReturnValue({ 
        isValid: false, 
        missingFields: ['category', 'location'] 
      });

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(mockCreateValidationErrorResponse).toHaveBeenCalledWith(['category', 'location']);
    });

    it('should handle invalid holding value', async () => {
      const requestBody = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 0, // Invalid value
        category: 'Technology',
        location: 'US'
      };

      mockValidateRequiredFields.mockReturnValue({ isValid: true, missingFields: [] });

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(mockHandleApiError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid holding value - value must be greater than 0'
        }),
        'POST /api/holdings'
      );
    });

    it('should handle backward compatibility with value field', async () => {
      const requestBody = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        value: 1000, // Old field
        category: 'Technology',
        location: 'US'
      };

      const mockUser = {
        id: 'default-user',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockCategory = {
        id: 'cat-1',
        name: 'Technology'
      };

      const mockHolding = {
        id: 'holding-1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        valueINR: 0,
        valueUSD: 0,
        entryCurrency: 'SGD',
        location: 'US',
        category: mockCategory,
        quantity: null,
        unitPrice: null,
        assetType: null,
        costBasis: null
      };

      mockValidateRequiredFields.mockReturnValue({ isValid: true, missingFields: [] });
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.assetCategory.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.holdings.create.mockResolvedValue(mockHolding);

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(mockPrisma.holdings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          valueSGD: 1000,
          valueINR: 0,
          valueUSD: 0
        }),
        include: {
          category: true
        }
      });
    });

    it('should handle database errors', async () => {
      const requestBody = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        category: 'Technology',
        location: 'US'
      };

      const error = new Error('Database error');
      mockValidateRequiredFields.mockReturnValue({ isValid: true, missingFields: [] });
      mockPrisma.user.findFirst.mockRejectedValue(error);

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(mockHandleApiError).toHaveBeenCalledWith(error, 'POST /api/holdings');
    });

    it('should handle optional fields correctly', async () => {
      const requestBody = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        category: 'Technology',
        location: 'US',
        costBasis: 95,
        quantity: 10,
        unitPrice: 100,
        currentUnitPrice: 105,
        manualPricing: true,
        assetType: 'stock'
      };

      const mockUser = {
        id: 'default-user',
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockCategory = {
        id: 'cat-1',
        name: 'Technology'
      };

      const mockHolding = {
        id: 'holding-1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        valueSGD: 1000,
        valueINR: 0,
        valueUSD: 0,
        entryCurrency: 'SGD',
        location: 'US',
        category: mockCategory,
        quantity: 10,
        unitPrice: 100,
        assetType: 'stock',
        costBasis: 95
      };

      mockValidateRequiredFields.mockReturnValue({ isValid: true, missingFields: [] });
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.assetCategory.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.holdings.create.mockResolvedValue(mockHolding);

      const request = createMockRequest(requestBody);
      await POST(request);

      expect(mockPrisma.holdings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          costBasis: 95,
          quantity: 10,
          unitPrice: 100,
          currentUnitPrice: 105,
          priceSource: 'manual',
          assetType: 'stock'
        }),
        include: {
          category: true
        }
      });
    });
  });
}); 