import { 
  createAppError, 
  createErrorResponse, 
  handleApiError, 
  validateRequiredFields, 
  createValidationErrorResponse,
  handleNetworkError,
  retryRequest,
  AppError,
  ErrorResponse
} from '../../app/lib/errorHandling';
import { ERROR_MESSAGES } from '../../app/lib/constants';
import { NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn()
  }
}));

describe('errorHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAppError', () => {
    it('should create a standardized error object', () => {
      const error = createAppError('TEST_ERROR', 'Test message', 400, 'Test details');
      
      expect(error).toEqual({
        code: 'TEST_ERROR',
        message: 'Test message',
        details: 'Test details',
        statusCode: 400,
        timestamp: expect.any(String)
      });
    });

    it('should use default status code when not provided', () => {
      const error = createAppError('TEST_ERROR', 'Test message');
      
      expect(error.statusCode).toBe(500);
    });

    it('should generate ISO timestamp', () => {
      const error = createAppError('TEST_ERROR', 'Test message');
      
      expect(new Date(error.timestamp).toISOString()).toBe(error.timestamp);
    });

    it('should handle optional details parameter', () => {
      const error = createAppError('TEST_ERROR', 'Test message', 400);
      
      expect(error.details).toBeUndefined();
    });
  });

  describe('createErrorResponse', () => {
    it('should create a standardized error response', () => {
      const mockJsonResponse = { success: false, error: {} };
      (NextResponse.json as jest.Mock).mockReturnValue(mockJsonResponse);

      const response = createErrorResponse('TEST_ERROR', 'Test message', 400, 'Test details');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'Test message',
            details: 'Test details',
            statusCode: 400,
            timestamp: expect.any(String)
          }
        },
        { status: 400 }
      );
      expect(response).toBe(mockJsonResponse);
    });

    it('should use default status code when not provided', () => {
      (NextResponse.json as jest.Mock).mockReturnValue({});

      createErrorResponse('TEST_ERROR', 'Test message');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            statusCode: 500
          })
        }),
        { status: 500 }
      );
    });
  });

  describe('handleApiError', () => {
    it('should handle "not found" errors', () => {
      const error = new Error('Resource not found');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (NextResponse.json as jest.Mock).mockReturnValue({});

      handleApiError(error, 'test-context');
      
      expect(consoleSpy).toHaveBeenCalledWith('API Error in test-context:', error);
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND',
            message: ERROR_MESSAGES.VALIDATION_ERROR,
            statusCode: 404
          })
        },
        { status: 404 }
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle validation errors', () => {
      const error = new Error('validation failed');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (NextResponse.json as jest.Mock).mockReturnValue({});

      handleApiError(error, 'test-context');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: ERROR_MESSAGES.VALIDATION_ERROR,
            statusCode: 400
          })
        },
        { status: 400 }
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle unauthorized errors', () => {
      const error = new Error('unauthorized access');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (NextResponse.json as jest.Mock).mockReturnValue({});

      handleApiError(error, 'test-context');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'Unauthorized access',
            statusCode: 401
          })
        },
        { status: 401 }
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (NextResponse.json as jest.Mock).mockReturnValue({});

      handleApiError(error, 'test-context');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_ERROR',
            message: ERROR_MESSAGES.API_ERROR,
            statusCode: 500
          })
        },
        { status: 500 }
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle unknown error types', () => {
      const error = 'String error';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (NextResponse.json as jest.Mock).mockReturnValue({});

      handleApiError(error, 'test-context');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: expect.objectContaining({
            code: 'UNKNOWN_ERROR',
            message: ERROR_MESSAGES.API_ERROR,
            statusCode: 500
          })
        },
        { status: 500 }
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('validateRequiredFields', () => {
    it('should validate all required fields are present', () => {
      const data = {
        name: 'John',
        email: 'john@example.com',
        age: 30
      };
      const requiredFields = ['name', 'email', 'age'];

      const result = validateRequiredFields(data, requiredFields);
      
      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('should detect missing fields', () => {
      const data = {
        name: 'John',
        email: '',
        age: null
      };
      const requiredFields = ['name', 'email', 'age'];

      const result = validateRequiredFields(data, requiredFields);
      
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['email', 'age']);
    });

    it('should handle undefined fields', () => {
      const data = {
        name: 'John',
        email: undefined
      };
      const requiredFields = ['name', 'email'];

      const result = validateRequiredFields(data, requiredFields);
      
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['email']);
    });

    it('should handle empty string fields', () => {
      const data = {
        name: '',
        email: 'john@example.com'
      };
      const requiredFields = ['name', 'email'];

      const result = validateRequiredFields(data, requiredFields);
      
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toEqual(['name']);
    });

    it('should handle zero values as valid', () => {
      const data = {
        name: 'John',
        age: 0
      };
      const requiredFields = ['name', 'age'];

      const result = validateRequiredFields(data, requiredFields);
      
      expect(result.isValid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });
  });

  describe('createValidationErrorResponse', () => {
    it('should create validation error response with missing fields', () => {
      const missingFields = ['email', 'age'];
      (NextResponse.json as jest.Mock).mockReturnValue({});

      createValidationErrorResponse(missingFields);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: ERROR_MESSAGES.VALIDATION_ERROR,
            statusCode: 400,
            details: 'Missing required fields: email, age'
          })
        },
        { status: 400 }
      );
    });
  });

  describe('handleNetworkError', () => {
    it('should handle fetch errors', () => {
      const error = new Error('fetch failed');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = handleNetworkError(error, '/api/test');
      
      expect(consoleSpy).toHaveBeenCalledWith('Network error calling /api/test:', error);
      expect(result).toBe(ERROR_MESSAGES.NETWORK_ERROR);
      
      consoleSpy.mockRestore();
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = handleNetworkError(error, '/api/test');
      
      expect(result).toBe('Something went wrong');
      
      consoleSpy.mockRestore();
    });

    it('should handle unknown error types', () => {
      const error = 'String error';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = handleNetworkError(error, '/api/test');
      
      expect(result).toBe(ERROR_MESSAGES.API_ERROR);
      
      consoleSpy.mockRestore();
    });
  });

  describe('retryRequest', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return result on successful request', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');

      const result = await retryRequest(mockRequest);
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    it('should retry failed requests', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success');

      const resultPromise = retryRequest(mockRequest, 3, 1000);
      
      // Fast-forward time to trigger retry
      jest.advanceTimersByTime(1000);
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should throw error after max retries', async () => {
      const mockRequest = jest.fn().mockRejectedValue(new Error('Always fails'));

      const resultPromise = retryRequest(mockRequest, 3, 1000);
      
      // Fast-forward time to trigger all retries
      jest.advanceTimersByTime(1000);
      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(3000);
      
      await expect(resultPromise).rejects.toThrow('Always fails');
      expect(mockRequest).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should use exponential backoff', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce('success');

      const resultPromise = retryRequest(mockRequest, 3, 1000);
      
      // First retry after 1 second
      jest.advanceTimersByTime(1000);
      // Second retry after 2 seconds
      jest.advanceTimersByTime(2000);
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should handle non-Error objects', async () => {
      const mockRequest = jest.fn().mockRejectedValue('String error');

      const resultPromise = retryRequest(mockRequest, 1, 1000);
      
      await expect(resultPromise).rejects.toThrow('Unknown error');
    });

    it('should use default retry parameters', async () => {
      const mockRequest = jest.fn().mockResolvedValue('success');

      const result = await retryRequest(mockRequest);
      
      expect(result).toBe('success');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });
}); 