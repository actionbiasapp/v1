// __tests__/lib/config.test.ts
import { config, validateConfig, getApiUrl, isFeatureEnabled, getApiTimeout, getMaxRetries } from '@/app/lib/config'

describe('Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv }
    process.env.FMP_API_KEY = ''
    process.env.ALPHA_VANTAGE_API_KEY = ''
    process.env.DATABASE_URL = ''
    process.env.ENABLE_PRICE_DETECTION = ''
    process.env.ENABLE_AI_INSIGHTS = ''
    process.env.ENABLE_TAX_INTELLIGENCE = ''
    process.env.MAX_HOLDINGS_PER_CATEGORY = ''
    process.env.MAX_API_RETRIES = ''
    process.env.API_TIMEOUT_MS = ''
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('config object', () => {
    it('should have default values when environment variables are not set', () => {
      expect(config.FMP_API_KEY).toBe('')
      expect(config.ALPHA_VANTAGE_API_KEY).toBe('demo')
      expect(config.DATABASE_URL).toBe('')
      expect(config.NODE_ENV).toBe('development')
      expect(config.IS_DEVELOPMENT).toBe(true)
      expect(config.IS_PRODUCTION).toBe(false)
      expect(config.IS_TEST).toBe(false)
    })

    it('should use environment variables when set', () => {
      process.env.FMP_API_KEY = 'test-key'
      process.env.ALPHA_VANTAGE_API_KEY = 'test-alpha'
      process.env.DATABASE_URL = 'postgresql://test'
      process.env.ENABLE_PRICE_DETECTION = 'false'
      process.env.MAX_HOLDINGS_PER_CATEGORY = '100'
      process.env.MAX_API_RETRIES = '5'
      process.env.API_TIMEOUT_MS = '15000'

      // Re-import to get updated config
      jest.resetModules()
      const { config: updatedConfig } = require('../../app/lib/config')

      expect(updatedConfig.FMP_API_KEY).toBe('test-key')
      expect(updatedConfig.ALPHA_VANTAGE_API_KEY).toBe('test-alpha')
      expect(updatedConfig.DATABASE_URL).toBe('postgresql://test')
      expect(updatedConfig.NODE_ENV).toBe('production')
      expect(updatedConfig.IS_PRODUCTION).toBe(true)
      expect(updatedConfig.ENABLE_PRICE_DETECTION).toBe(false)
      expect(updatedConfig.MAX_HOLDINGS_PER_CATEGORY).toBe(100)
      expect(updatedConfig.MAX_API_RETRIES).toBe(5)
      expect(updatedConfig.API_TIMEOUT_MS).toBe(15000)
    })

    it('should handle feature flags correctly', () => {
      process.env.ENABLE_PRICE_DETECTION = 'false'
      process.env.ENABLE_AI_INSIGHTS = 'true'
      process.env.ENABLE_TAX_INTELLIGENCE = 'false'

      jest.resetModules()
      const { config: updatedConfig } = require('../../app/lib/config')

      expect(updatedConfig.ENABLE_PRICE_DETECTION).toBe(false)
      expect(updatedConfig.ENABLE_AI_INSIGHTS).toBe(true)
      expect(updatedConfig.ENABLE_TAX_INTELLIGENCE).toBe(false)
    })
  })

  describe('validateConfig', () => {
    it('should throw error when required keys are missing', () => {
      expect(() => validateConfig()).toThrow('Missing required environment variables: DATABASE_URL')
    })

    it('should not throw error when required keys are present', () => {
      process.env.DATABASE_URL = 'postgresql://test'
      jest.resetModules()
      const { validateConfig: updatedValidateConfig } = require('../../app/lib/config')
      
      expect(() => updatedValidateConfig()).not.toThrow()
    })

    it('should warn when FMP_API_KEY is missing in production', () => {
      process.env.DATABASE_URL = 'postgresql://test'
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { validateConfig: updatedValidateConfig } = require('../../app/lib/config')
      
      updatedValidateConfig()
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ FMP_API_KEY not set in production environment')
      
      consoleSpy.mockRestore()
    })
  })

  describe('helper functions', () => {
    it('should generate correct API URL', () => {
      const url = getApiUrl('/api/holdings')
      expect(url).toBe('/api/holdings') // In browser context, BASE_URL is empty
    })

    it('should check feature flags correctly', () => {
      expect(isFeatureEnabled('ENABLE_PRICE_DETECTION')).toBe(true) // Default is true
      expect(isFeatureEnabled('ENABLE_AI_INSIGHTS')).toBe(true) // Default is true
      expect(isFeatureEnabled('ENABLE_TAX_INTELLIGENCE')).toBe(true) // Default is true
    })

    it('should return correct timeout and retry values', () => {
      expect(getApiTimeout()).toBe(10000) // Default 10 seconds
      expect(getMaxRetries()).toBe(3) // Default 3 retries
    })
  })
}) 