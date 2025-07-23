// app/lib/config.ts
// Centralized environment configuration

interface EnvironmentConfig {
  // API Keys
  FMP_API_KEY: string;
  ALPHA_VANTAGE_API_KEY: string;
  
  // URLs
  BASE_URL: string;
  NEXTAUTH_URL: string;
  
  // Database
  DATABASE_URL: string;
  
  // Environment
  NODE_ENV: 'development' | 'production' | 'test';
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
  IS_TEST: boolean;
  
  // Feature Flags
  ENABLE_PRICE_DETECTION: boolean;
  ENABLE_AI_INSIGHTS: boolean;
  ENABLE_TAX_INTELLIGENCE: boolean;
  
  // Limits
  MAX_HOLDINGS_PER_CATEGORY: number;
  MAX_API_RETRIES: number;
  API_TIMEOUT_MS: number;
}

// Environment configuration
export const config: EnvironmentConfig = {
  // API Keys
  FMP_API_KEY: process.env.FMP_API_KEY || '',
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
  
  // URLs
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window !== 'undefined' ? '' : 'http://localhost:3000'),
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Environment
  NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  
  // Feature Flags
  ENABLE_PRICE_DETECTION: process.env.ENABLE_PRICE_DETECTION !== 'false',
  ENABLE_AI_INSIGHTS: process.env.ENABLE_AI_INSIGHTS !== 'false',
  ENABLE_TAX_INTELLIGENCE: process.env.ENABLE_TAX_INTELLIGENCE !== 'false',
  
  // Limits
  MAX_HOLDINGS_PER_CATEGORY: parseInt(process.env.MAX_HOLDINGS_PER_CATEGORY || '50'),
  MAX_API_RETRIES: parseInt(process.env.MAX_API_RETRIES || '3'),
  API_TIMEOUT_MS: parseInt(process.env.API_TIMEOUT_MS || '10000'),
};

// Validation
export function validateConfig(): void {
  const requiredKeys = ['DATABASE_URL'];
  const missingKeys = requiredKeys.filter(key => !config[key as keyof EnvironmentConfig]);
  
  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }
  
  if (config.IS_PRODUCTION && !config.FMP_API_KEY) {
    console.warn('⚠️ FMP_API_KEY not set in production environment');
  }
}

// Helper functions
export function getApiUrl(path: string): string {
  return `${config.BASE_URL}${path}`;
}

export function isFeatureEnabled(feature: keyof Pick<EnvironmentConfig, 'ENABLE_PRICE_DETECTION' | 'ENABLE_AI_INSIGHTS' | 'ENABLE_TAX_INTELLIGENCE'>): boolean {
  return config[feature];
}

export function getApiTimeout(): number {
  return config.API_TIMEOUT_MS;
}

export function getMaxRetries(): number {
  return config.MAX_API_RETRIES;
}

// Development helpers
export function logConfig(): void {
  if (config.IS_DEVELOPMENT) {
    console.log('🔧 Environment Configuration:', {
      NODE_ENV: config.NODE_ENV,
      BASE_URL: config.BASE_URL,
      ENABLE_PRICE_DETECTION: config.ENABLE_PRICE_DETECTION,
      ENABLE_AI_INSIGHTS: config.ENABLE_AI_INSIGHTS,
      ENABLE_TAX_INTELLIGENCE: config.ENABLE_TAX_INTELLIGENCE,
      MAX_HOLDINGS_PER_CATEGORY: config.MAX_HOLDINGS_PER_CATEGORY,
      MAX_API_RETRIES: config.MAX_API_RETRIES,
      API_TIMEOUT_MS: config.API_TIMEOUT_MS,
    });
  }
} 