// __tests__/lib/constants.test.ts
import { 
  API_ENDPOINTS, 
  FINANCIAL_CONSTANTS, 
  ALLOCATION_TARGETS, 
  DEFAULT_ALLOCATION_TARGETS,
  UI_CONSTANTS 
} from '@/app/lib/constants'

describe('Constants', () => {
  describe('API_ENDPOINTS', () => {
    it('should have all required API endpoints', () => {
      expect(API_ENDPOINTS.HOLDINGS).toBe('/api/holdings')
      expect(API_ENDPOINTS.INSIGHTS).toBe('/api/insights')
      expect(API_ENDPOINTS.INTELLIGENCE).toBe('/api/intelligence')
      expect(API_ENDPOINTS.FINANCIAL_PROFILE).toBe('/api/financial-profile')
      expect(API_ENDPOINTS.YEARLY_DATA).toBe('/api/yearly-data')
      expect(API_ENDPOINTS.EXCHANGE_RATES).toBe('/api/exchange-rates')
    })

    it('should be readonly', () => {
      expect(() => {
        (API_ENDPOINTS as any).HOLDINGS = '/test'
      }).toThrow()
    })
  })

  describe('FINANCIAL_CONSTANTS', () => {
    it('should have correct SRS limits', () => {
      expect(FINANCIAL_CONSTANTS.SRS_LIMIT_EMPLOYMENT_PASS).toBe(35700)
      expect(FINANCIAL_CONSTANTS.SRS_LIMIT_CITIZEN_PR).toBe(15300)
    })

    it('should have correct tax brackets', () => {
      expect(FINANCIAL_CONSTANTS.TAX_BRACKETS).toEqual({
        0: 0,
        20000: 2,
        30000: 3.5,
        40000: 7,
        80000: 11.5,
        120000: 15,
        160000: 18,
        200000: 19,
        240000: 19.5,
        320000: 20,
        500000: 22,
        1000000: 24
      })
    })

    it('should have correct FI targets', () => {
      expect(FINANCIAL_CONSTANTS.FI_TARGETS).toEqual({
        LEAN_FI: 1000000,
        FULL_FI: 1850000,
        FAT_FI: 2500000
      })
    })
  })

  describe('ALLOCATION_TARGETS', () => {
    it('should have correct default allocation targets', () => {
      expect(ALLOCATION_TARGETS.CORE).toBe(25)
      expect(ALLOCATION_TARGETS.GROWTH).toBe(55)
      expect(ALLOCATION_TARGETS.HEDGE).toBe(10)
      expect(ALLOCATION_TARGETS.LIQUIDITY).toBe(10)
      expect(ALLOCATION_TARGETS.REBALANCE_THRESHOLD).toBe(5)
    })

    it('should match DEFAULT_ALLOCATION_TARGETS', () => {
      expect(ALLOCATION_TARGETS).toEqual(DEFAULT_ALLOCATION_TARGETS)
    })

    it('should total 100%', () => {
      const total = ALLOCATION_TARGETS.CORE + 
                   ALLOCATION_TARGETS.GROWTH + 
                   ALLOCATION_TARGETS.HEDGE + 
                   ALLOCATION_TARGETS.LIQUIDITY
      expect(total).toBe(100)
    })
  })

  describe('UI_CONSTANTS', () => {
    it('should have reasonable component limits', () => {
      expect(UI_CONSTANTS.MAX_COMPONENT_LINES).toBe(500)
      expect(UI_CONSTANTS.MAX_FILE_SIZE_KB).toBe(50)
    })

    it('should have reasonable display limits', () => {
      expect(UI_CONSTANTS.MAX_DISPLAY_HOLDINGS).toBe(10)
      expect(UI_CONSTANTS.MAX_ACTION_ITEMS).toBe(5)
    })

    it('should have reasonable animation durations', () => {
      expect(UI_CONSTANTS.TRANSITION_DURATION).toBe(300)
      expect(UI_CONSTANTS.LOADING_DELAY).toBe(100)
    })
  })

  describe('Constants validation', () => {
    it('should have valid allocation targets that sum to 100', () => {
      const targets = [ALLOCATION_TARGETS.CORE, ALLOCATION_TARGETS.GROWTH, ALLOCATION_TARGETS.HEDGE, ALLOCATION_TARGETS.LIQUIDITY]
      const total = targets.reduce((sum, target) => sum + target, 0)
      expect(total).toBe(100)
    })

    it('should have positive values for all constants', () => {
      expect(ALLOCATION_TARGETS.CORE).toBeGreaterThan(0)
      expect(ALLOCATION_TARGETS.GROWTH).toBeGreaterThan(0)
      expect(ALLOCATION_TARGETS.HEDGE).toBeGreaterThan(0)
      expect(ALLOCATION_TARGETS.LIQUIDITY).toBeGreaterThan(0)
      expect(ALLOCATION_TARGETS.REBALANCE_THRESHOLD).toBeGreaterThan(0)
      expect(FINANCIAL_CONSTANTS.SRS_LIMIT_EMPLOYMENT_PASS).toBeGreaterThan(0)
      expect(FINANCIAL_CONSTANTS.SRS_LIMIT_CITIZEN_PR).toBeGreaterThan(0)
    })

    it('should have valid API endpoints that start with /api', () => {
      Object.values(API_ENDPOINTS).forEach(endpoint => {
        expect(endpoint).toMatch(/^\/api\//)
      })
    })
  })
}) 