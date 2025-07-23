// app/lib/errorHandling.ts
// Centralized error handling utilities

import { NextResponse } from 'next/server';
import { ERROR_MESSAGES } from './constants';

export interface AppError {
  code: string;
  message: string;
  details?: string;
  statusCode: number;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: AppError;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Create a standardized error object
 */
export function createAppError(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: string
): AppError {
  return {
    code,
    message,
    details,
    statusCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a standardized error response for API routes
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: string
): NextResponse<ErrorResponse> {
  const error = createAppError(code, message, statusCode, details);
  
  return NextResponse.json(
    { success: false, error },
    { status: statusCode }
  );
}

/**
 * Create a standardized success response for API routes
 * Use this for APIs that expect { success: true, data: ... } structure
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  );
}

/**
 * Create a legacy-compatible success response
 * Use this for APIs that return data directly (like holdings API)
 */
export function createLegacySuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status: statusCode });
}

/**
 * Handle common API errors with standardized responses
 */
export function handleApiError(error: unknown, context: string): NextResponse<ErrorResponse> {
  console.error(`API Error in ${context}:`, error);
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('not found')) {
      return createErrorResponse(
        'NOT_FOUND',
        ERROR_MESSAGES.VALIDATION_ERROR,
        404,
        error.message
      );
    }
    
    if (error.message.includes('validation')) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        ERROR_MESSAGES.VALIDATION_ERROR,
        400,
        error.message
      );
    }
    
    if (error.message.includes('unauthorized')) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Unauthorized access',
        401,
        error.message
      );
    }
    
    // Default error handling
    return createErrorResponse(
      'INTERNAL_ERROR',
      ERROR_MESSAGES.API_ERROR,
      500,
      error.message
    );
  }
  
  // Handle unknown errors
  return createErrorResponse(
    'UNKNOWN_ERROR',
    ERROR_MESSAGES.API_ERROR,
    500,
    'An unexpected error occurred'
  );
}

/**
 * Safe async wrapper for API route handlers
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw new Error(`${context}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
}

/**
 * Validate required fields in request data
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(missingFields: string[]): NextResponse<ErrorResponse> {
  return createErrorResponse(
    'VALIDATION_ERROR',
    ERROR_MESSAGES.VALIDATION_ERROR,
    400,
    `Missing required fields: ${missingFields.join(', ')}`
  );
}

/**
 * Network error handler for client-side requests
 */
export function handleNetworkError(error: unknown, endpoint: string): string {
  console.error(`Network error calling ${endpoint}:`, error);
  
  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    return error.message;
  }
  
  return ERROR_MESSAGES.API_ERROR;
}

/**
 * Retry mechanism for failed requests
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
} 