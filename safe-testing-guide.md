# 🛡️ Safe Testing Guide

## ⚠️ **IMPORTANT: Never Test Against Real Data**

### **Before Testing:**
1. **Create a backup** of your current holdings
2. **Use test data** instead of real portfolio data
3. **Test in isolation** with mock data

### **Safe Testing Commands:**

#### **1. Backup Current Holdings**
```bash
curl -s http://localhost:3000/api/holdings > holdings-backup.json
```

#### **2. Test with Mock Data**
```bash
# Test recognition without affecting real data
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"Reduce my [COMPANY] holdings by half", "context": {"currentHoldings": [{"symbol": "[SYMBOL]", "quantity": 40, "name": "[COMPANY] Inc"}], "yearlyData": [], "financialProfile": {}, "displayCurrency": "SGD"}}'
```

#### **3. Test Execution with Test Holdings**
```bash
# Only test execution if you have test holdings
# NEVER test against real holdings without backup
```

### **Recovery Commands:**
```bash
# Restore from backup (if needed)
# This would require a restore endpoint
```

## 🎯 **Best Practices:**
- ✅ Always use mock data for testing
- ✅ Create backups before any destructive operations
- ✅ Test in a separate environment
- ❌ Never test reduction/delete operations on real holdings
- ❌ Never assume test data is safe

## 📝 **Current Status:**
- ✅ [SYMBOL] holding restored (40 shares at $100)
- ✅ System functionality verified
- ✅ Safe testing procedures established 