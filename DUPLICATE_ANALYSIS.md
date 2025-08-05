# Duplicate Information and Hardcoded Values Analysis

## **Issue 1: Portfolio Value Hydration Mismatch** ✅ FIXED

**Problem**: Portfolio value shows $544k initially, then changes to $527k after DB load.

**Root Cause**: Sample data shown initially, then replaced with real DB data.

**Solution**: 
- Created `PortfolioSkeleton` component for better UX
- Removed sample data fallback in `usePortfolioData`
- Now shows skeleton loader instead of misleading sample data

## **Issue 2: Duplicate Information Analysis**

### **Portfolio Value Display** 🔄 NEEDS CONSOLIDATION

**Current Duplicates**:
1. `PortfolioStatusMetrics` - Main portfolio value display
2. `SignalMode` - Hero section with portfolio value
3. `FixedPortfolioGrid` - Shows total value in header
4. `AppleRadialAllocation` - Shows total value in tooltip
5. `IndividualHoldingCard` - Shows individual holding values

**Recommendation**: 
- Keep `PortfolioStatusMetrics` as primary display
- Remove duplicate from `SignalMode` hero section
- Consolidate all portfolio value calculations through `calculatePortfolioValue`

### **FI Progress Information** 🔄 NEEDS CONSOLIDATION

**Current Duplicates**:
1. `PortfolioStatusMetrics` - FI progress bar and milestone text
2. `FIJourneyTab` - FI progress calculations
3. `FIPlanningTab` - FI target settings
4. `SignalMode` - FI progress display

**Recommendation**:
- Centralize all FI calculations in `fiTargets.ts`
- Use single source of truth for FI progress
- Remove duplicate calculations from individual components

### **Savings Information** 🔄 NEEDS CONSOLIDATION

**Current Duplicates**:
1. `PortfolioStatusMetrics` - Total savings display
2. `NetWorthTracker` - Savings in chart
3. `FinancialSetupModal` - Yearly savings data
4. `FIJourneyTab` - Savings calculations

**Recommendation**:
- Create centralized savings calculation utility
- Use yearly data as source of truth
- Remove hardcoded savings values

## **Issue 3: Hardcoded Values Analysis**

### **Financial Constants** ✅ CENTRALIZED

**Previously Hardcoded**:
- SRS Limits: 35700, 15000
- FI Targets: 1000000, 1850000, 2500000
- Default FI Goal: 2500000
- Default FI Year: 2032
- Default Savings: 350000
- Tax Brackets: Various rates

**Solution**: 
- Created `APP_CONFIG` in `app/lib/config.ts`
- Centralized all financial constants
- Added helper functions for dynamic values

### **Exchange Rates** ✅ CENTRALIZED

**Previously Hardcoded**:
- SGD_TO_USD: 1.35
- SGD_TO_INR: 63.0
- Various conversion rates

**Solution**:
- Added to `APP_CONFIG.EXCHANGE_RATES`
- Used as fallback when live rates unavailable

### **User Profile Defaults** ✅ CENTRALIZED

**Previously Hardcoded**:
- Default tax status: 'Employment Pass'
- Default country: 'Singapore'
- Default currency: 'SGD'
- Allocation targets: 25, 55, 10, 10, 5

**Solution**:
- Added to `APP_CONFIG.USER_PROFILE`
- Added to `APP_CONFIG.ALLOCATION`

## **Files Modified for Centralization**

### **New Files**:
- `app/lib/config.ts` - Centralized configuration
- `app/components/ui/PortfolioSkeleton.tsx` - Loading skeleton

### **Updated Files**:
- `app/hooks/usePortfolioData.ts` - Removed sample data fallback
- `app/components/PortfolioDashboard.tsx` - Uses skeleton loader
- `app/components/PortfolioStatusMetrics.tsx` - Uses centralized config
- `app/lib/fiTargets.ts` - Uses centralized config
- `app/components/financial-setup/FIMilestonesTab.tsx` - Uses centralized config
- `scripts/seed-milestones.ts` - Uses centralized config

## **Remaining Duplicates to Address**

### **High Priority**:
1. **Portfolio Value Calculations**: Multiple components calculate total value independently
2. **FI Progress Calculations**: Duplicate logic across components
3. **Savings Calculations**: Hardcoded vs. dynamic values

### **Medium Priority**:
1. **Currency Conversion**: Some components have inline conversion logic
2. **Tax Calculations**: Duplicate SRS limit logic
3. **Allocation Calculations**: Multiple places calculate percentages

### **Low Priority**:
1. **Date Formatting**: Inconsistent date display formats
2. **Number Formatting**: Some components format numbers independently

## **Next Steps**

1. **Create Portfolio Value Context**: Single source of truth for portfolio calculations
2. **Consolidate FI Logic**: Move all FI calculations to centralized utilities
3. **Create Savings Context**: Centralized savings calculations from yearly data
4. **Standardize Currency Handling**: Single currency conversion utility
5. **Create Tax Context**: Centralized tax calculations and limits

## **Benefits of Centralization**

- **Consistency**: All components use same values
- **Maintainability**: Single place to update constants
- **Performance**: Reduced duplicate calculations
- **Reliability**: Eliminates hardcoded value mismatches
- **User Experience**: No more value changes after load 