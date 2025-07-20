# Enhanced Live Pricing V5 - Complete System Status & Next Phase Development Plan

> **🔄 SUPERSEDES Enhanced Live Pricing V4**: This document represents the current production state and roadmap for the next major enhancement - Asset Type Selection for accurate API routing.

## 📊 **CURRENT SYSTEM STATUS (V4 COMPLETE)**

### **✅ PRODUCTION DEPLOYED & OPERATIONAL**
- **Live System**: https://v1-pi-six.vercel.app/
- **Build Status**: ✅ All TypeScript errors resolved
- **Git Status**: ✅ Clean, all changes committed and pushed
- **Database**: ✅ Multi-currency schema with live pricing fields active
- **APIs**: ✅ Dual API system (Intelligence + Insights) working
- **Cron Jobs**: ✅ Daily price updates configured (6 AM UTC)

---

## 🎯 **V4 ACHIEVEMENTS (COMPLETED)**

### **Core Features Successfully Implemented:**

#### **✅ Enhanced Holdings Management**
- **Weighted average calculations** with currency conversion
- **Auto-population** of company names from FMP API  
- **Multi-currency storage** (SGD/USD/INR) with live conversion
- **Mobile-responsive confirmation dialogs**
- **Legacy data compatibility** maintained

#### **✅ Live Pricing Infrastructure**
```javascript
// WORKING API ENDPOINTS
/api/prices/update    // Daily cron updates (6 AM UTC)
/api/prices/detect    // Symbol price source detection
/api/prices/manual    // Manual price overrides
/api/holdings         // CRUD with weighted averages
/api/exchange-rates   // Multi-currency conversion
```

#### **✅ Database Schema (Production Ready)**
```sql
-- Holdings table with live pricing fields
quantity          Decimal?      -- Number of shares/units
unitPrice         Decimal?      -- Original purchase price per unit  
currentUnitPrice  Decimal?      -- Current market price (updated by cron)
costBasis         Decimal?      -- Total invested (for P&L)
priceSource       String?       -- 'fmp'|'coingecko'|'manual'|'yesterday'
priceUpdated      DateTime?     -- Last price update timestamp
valueSGD/USD/INR  Decimal       -- Multi-currency storage
entryCurrency     String        -- Original purchase currency
```

#### **✅ Migration System**
- **Portfolio migration script** tested and working
- **Safety features**: Backup, dry-run, test-mode, rollback capability
- **25 holdings ready** for migration with accurate IBKR data
- **Multi-currency conversion** built-in

---

## ⚠️ **CRITICAL ISSUE IDENTIFIED: API ROUTING PROBLEM**

### **The Problem:**
```bash
# Current Issue (V4)
curl -d '{"symbol":"ETH"}' /api/prices/detect
# Returns: {"source": "fmp", "companyName": "Grayscale Ethereum Mini Trust"}
# Expected: {"source": "coingecko", "companyName": "Ethereum"}
```

**Root Cause**: Auto-detection logic sends ETH to FMP instead of CoinGecko, creating wrong company names and incorrect pricing sources.

**Impact**: 
- Crypto assets get wrong company names
- Wrong pricing source affects daily updates
- User confusion between actual crypto vs crypto ETFs

---

## 🚀 **V5 ENHANCEMENT PLAN: ASSET TYPE SELECTION**

### **80/20 Solution: User-Controlled API Routing**

Instead of complex auto-detection, let users specify asset type:

```typescript
interface AssetTypeSelection {
  stock: "FMP API - Gets company name + stock price";
  crypto: "CoinGecko API - Gets crypto name + crypto price"; 
  manual: "No API - User enters everything manually";
}
```

### **User Experience:**
```
Symbol: [ETH        ]
Type:   [Crypto ▼  ] ← NEW: User selects
        │ Stock     │
        │ Crypto    │ ← Routes to CoinGecko  
        │ Manual    │
Name:   [Ethereum  ] ← Auto-populated correctly
```

---

## 📋 **IMPLEMENTATION PLAN V5**

### **Phase 1: Type System Updates (1 hour)**

#### **File: `app/lib/types/shared.ts`**
```typescript
// ADD: Asset type to form data
export interface HoldingFormData {
  symbol: string;
  name: string;
  amount: number;
  currency: 'SGD' | 'USD' | 'INR';
  location: string;
  quantity?: number;
  unitPrice?: number;
  assetType?: 'stock' | 'crypto' | 'manual';  // ← NEW
  _confirmedQuantity?: number;
  _confirmedUnitPrice?: number;
  _confirmedTotalCost?: number;
  _priceSource?: string;
  _enableAutoPricing?: boolean;
}

// ADD: Asset type to detection result
export interface PriceDetectionResult {
  symbol: string;
  supportsAutoPricing: boolean;
  source: 'fmp' | 'coingecko' | 'manual';
  currentPrice?: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  companyName?: string;
  industry?: string;
  assetType?: 'stock' | 'crypto' | 'manual';  // ← NEW
  existingHoldings?: Array<{
    id: string;
    name: string;
    location: string;
    valueUSD: number;
  }>;
}
```

### **Phase 2: Price Detection Logic Updates (30 minutes)**

#### **File: `app/lib/priceDetection.ts`**
```typescript
// UPDATE: Method signature to accept assetType
async detectPriceSource(symbol: string, assetType?: string): Promise<PriceDetectionResult> {
  try {
    // NEW: User-specified routing
    if (assetType === 'crypto') {
      return await this.fetchCryptoPrice(symbol);
    }
    
    if (assetType === 'stock') {
      return await this.fetchFMPPrice(symbol);
    }
    
    if (assetType === 'manual') {
      return {
        symbol,
        supportsAutoPricing: false,
        source: 'manual',
        currency: 'USD',
        confidence: 'low',
        assetType: 'manual'
      };
    }
    
    // FALLBACK: Existing auto-detection for backwards compatibility
    const priceResult = await this.detectBasicPricing(symbol);
    const enhanced = await this.enhanceWithCompanyData(symbol, priceResult);
    return enhanced;
    
  } catch (error) {
    // Error handling...
  }
}

// NEW: Clean crypto price fetching
private async fetchCryptoPrice(symbol: string): Promise<PriceDetectionResult> {
  try {
    const coinId = this.getCoinGeckoId(symbol);
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    const data = await response.json();
    
    if (data[coinId]?.usd) {
      return {
        symbol,
        supportsAutoPricing: true,
        source: 'coingecko',
        currentPrice: data[coinId].usd,
        currency: 'USD',
        confidence: 'high',
        companyName: this.getCryptoDisplayName(symbol), // ← NEW: Clean crypto names
        assetType: 'crypto'
      };
    }
  } catch (error) {
    // Error handling...
  }
}

// NEW: Crypto display name mapping
private getCryptoDisplayName(symbol: string): string {
  const cryptoNames = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum', 
    'WBTC': 'Wrapped Bitcoin',
    'USDC': 'USD Coin',
    'DOGE': 'Dogecoin',
    'ADA': 'Cardano',
    // Add more as needed...
  };
  return cryptoNames[symbol.toUpperCase()] || symbol.toUpperCase();
}
```

### **Phase 3: API Endpoint Updates (15 minutes)**

#### **File: `app/api/prices/detect/route.ts`**
```typescript
export async function POST(request: NextRequest) {
  try {
    const { symbol, assetType } = await request.json(); // ← ADD: assetType
    
    if (!symbol || symbol.length < 1) {
      return NextResponse.json({ 
        error: 'Symbol is required' 
      }, { status: 400 });
    }
    
    const detector = new PriceDetectionService();
    const result = await detector.detectPriceSource(symbol, assetType); // ← PASS: assetType
    
    return NextResponse.json(result);
  } catch (error) {
    // Error handling...
  }
}
```

### **Phase 4: Frontend UI Updates (45 minutes)**

#### **File: `app/components/forms/HoldingForm.tsx`**
```typescript
// ADD: Asset type state
const [assetType, setAssetType] = useState<'stock' | 'crypto' | 'manual'>('stock');

// ADD: Asset type selector UI
<div className="mb-3">
  <label className="block text-sm font-medium text-slate-300 mb-1">
    Asset Type
  </label>
  <select 
    value={assetType}
    onChange={(e) => setAssetType(e.target.value as 'stock' | 'crypto' | 'manual')}
    className="w-full bg-slate-700 text-white border border-slate-600 rounded px-3 py-2 text-sm"
  >
    <option value="stock">Stock (FMP API)</option>
    <option value="crypto">Crypto (CoinGecko)</option>
    <option value="manual">Manual Entry</option>
  </select>
</div>

// UPDATE: Price detection call to include assetType
const handleSymbolChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
  const symbol = e.target.value.toUpperCase();
  onFormDataChange({ ...formData, symbol, assetType }); // ← ADD: assetType
  
  if (symbol.length >= 2) {
    setPriceDetectionLoading(true);
    try {
      const response = await fetch('/api/prices/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, assetType }) // ← ADD: assetType
      });
      const detection = await response.json();
      setPriceDetection(detection);
      
      // Auto-populate company name
      if (detection.companyName && !formData.name) {
        onFormDataChange({ 
          ...formData, 
          symbol, 
          name: detection.companyName,
          assetType // ← ADD: assetType
        });
      }
    } catch (error) {
      // Error handling...
    } finally {
      setPriceDetectionLoading(false);
    }
  }
}, [formData, onFormDataChange, assetType]); // ← ADD: assetType dependency
```

### **Phase 5: Migration Script Updates (15 minutes)**

#### **File: `scripts/migrate-portfolio.js`**
```javascript
// ADD: Asset type to portfolio data
const portfolioData = {
  core: [
    {
      symbol: 'VUAA.L',
      name: 'Vanguard S&P 500 UCITS ETF',
      assetType: 'stock', // ← ADD
      // ... other fields
    }
  ],
  growth: [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      assetType: 'crypto', // ← ADD
      // ... other fields
    }
  ]
  // ... other categories
};
```

---

## 🧪 **TESTING STRATEGY**

### **Test Sequence:**
```bash
# 1. Test type definitions
npx tsc --noEmit

# 2. Test API routing
curl -d '{"symbol":"ETH","assetType":"crypto"}' /api/prices/detect
# Expected: {"source": "coingecko", "companyName": "Ethereum"}

curl -d '{"symbol":"AAPL","assetType":"stock"}' /api/prices/detect  
# Expected: {"source": "fmp", "companyName": "Apple Inc."}

# 3. Test UI integration
npm run dev
# Add new holding, verify asset type selector works

# 4. Test migration compatibility
node scripts/migrate-portfolio.js --test-mode
```

### **Success Criteria:**
- ✅ ETH routes to CoinGecko when assetType="crypto"
- ✅ AAPL routes to FMP when assetType="stock"  
- ✅ Manual option disables auto-pricing
- ✅ Migration script works with new asset types
- ✅ Backwards compatibility maintained (auto-detection fallback)

---

## 📦 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment:**
- [ ] All TypeScript errors resolved
- [ ] API routing tests pass
- [ ] UI asset type selector functional
- [ ] Migration script updated
- [ ] Backwards compatibility verified

### **Deployment Commands:**
```bash
# 1. Commit changes
git add . && git commit -m "feat: add asset type selection for accurate API routing"

# 2. Build test
npm run build

# 3. Deploy
git push origin main

# 4. Verify production
curl https://v1-pi-six.vercel.app/api/prices/detect -d '{"symbol":"ETH","assetType":"crypto"}'
```

---

## 🔄 **BACKWARDS COMPATIBILITY**

### **Existing Holdings:**
- Legacy holdings without `assetType` will use auto-detection fallback
- No data migration required
- Gradual adoption as users edit holdings

### **API Compatibility:**
- `/api/prices/detect` accepts optional `assetType` parameter
- Without `assetType`, uses existing auto-detection logic
- No breaking changes to existing integrations

---

## 📈 **FUTURE ROADMAP (Post V5)**

### **Phase 6: Enhanced Migration (Optional)**
- Full portfolio migration with accurate asset types
- Data cleanup for legacy holdings
- Performance optimization

### **Phase 7: Advanced Features**
- Asset type analytics (% crypto vs stocks)
- Type-specific insights and recommendations
- Enhanced portfolio categorization

### **Phase 8: Multi-User & Authentication**
- User accounts with NextAuth
- Individual portfolio management
- Subscription model implementation

---

## 🎯 **SUMMARY FOR NEXT LLM**

**Current State**: Enhanced Live Pricing V4 is production-deployed with weighted averages, multi-currency support, and live pricing. TypeScript errors resolved, migration script ready.

**Next Task**: Implement Asset Type Selection (V5) to fix API routing issues where ETH incorrectly goes to FMP instead of CoinGecko.

**Key Files to Modify**: 
1. `app/lib/types/shared.ts` (add assetType fields)
2. `app/lib/priceDetection.ts` (add user-controlled routing)
3. `app/api/prices/detect/route.ts` (accept assetType parameter)
4. `app/components/forms/HoldingForm.tsx` (add asset type selector)
5. `scripts/migrate-portfolio.js` (add asset types to data)

**Estimated Time**: 2-3 hours total

**Success Metric**: ETH with assetType="crypto" routes to CoinGecko and returns "Ethereum" as company name.

This enhancement solves the core API routing problem while maintaining 80/20 principles - simple user control over complex auto-detection logic.