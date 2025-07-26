#!/bin/bash

echo "🧪 Testing Quick Queries (No OpenAI API)"
echo "========================================"

# Test 1: Portfolio Summary
echo -e "\n1️⃣ Testing Portfolio Summary"
curl -s -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"Show my portfolio summary", "context": {"currentHoldings": [{"symbol": "AAPL", "quantity": 100, "name": "Apple Inc", "category": "Core", "unitPrice": 150, "currentUnitPrice": 160, "entryCurrency": "USD"}, {"symbol": "TSLA", "quantity": 50, "name": "Tesla Inc", "category": "Growth", "unitPrice": 200, "currentUnitPrice": 220, "entryCurrency": "USD"}], "yearlyData": [], "financialProfile": {}, "displayCurrency": "SGD"}}' | jq '.message'

# Test 2: Biggest Holding
echo -e "\n2️⃣ Testing Biggest Holding"
curl -s -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"What is my biggest holding?", "context": {"currentHoldings": [{"symbol": "AAPL", "quantity": 100, "name": "Apple Inc", "category": "Core", "unitPrice": 150, "currentUnitPrice": 160, "entryCurrency": "USD"}, {"symbol": "TSLA", "quantity": 50, "name": "Tesla Inc", "category": "Growth", "unitPrice": 200, "currentUnitPrice": 220, "entryCurrency": "USD"}], "yearlyData": [], "financialProfile": {}, "displayCurrency": "SGD"}}' | jq '.message'

# Test 3: Allocation Gaps
echo -e "\n3️⃣ Testing Allocation Gaps"
curl -s -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"Show allocation gaps", "context": {"currentHoldings": [{"symbol": "AAPL", "quantity": 100, "name": "Apple Inc", "category": "Core", "unitPrice": 150, "currentUnitPrice": 160, "entryCurrency": "USD"}, {"symbol": "TSLA", "quantity": 50, "name": "Tesla Inc", "category": "Growth", "unitPrice": 200, "currentUnitPrice": 220, "entryCurrency": "USD"}], "yearlyData": [], "financialProfile": {}, "displayCurrency": "SGD"}}' | jq '.message'

# Test 4: Total Value
echo -e "\n4️⃣ Testing Total Value"
curl -s -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"What is my total portfolio value?", "context": {"currentHoldings": [{"symbol": "AAPL", "quantity": 100, "name": "Apple Inc", "category": "Core", "unitPrice": 150, "currentUnitPrice": 160, "entryCurrency": "USD"}, {"symbol": "TSLA", "quantity": 50, "name": "Tesla Inc", "category": "Growth", "unitPrice": 200, "currentUnitPrice": 220, "entryCurrency": "USD"}], "yearlyData": [], "financialProfile": {}, "displayCurrency": "SGD"}}' | jq '.message'

# Test 5: Category Filter
echo -e "\n5️⃣ Testing Category Filter"
curl -s -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"Show Core holdings only", "context": {"currentHoldings": [{"symbol": "AAPL", "quantity": 100, "name": "Apple Inc", "category": "Core", "unitPrice": 150, "currentUnitPrice": 160, "entryCurrency": "USD"}, {"symbol": "TSLA", "quantity": 50, "name": "Tesla Inc", "category": "Growth", "unitPrice": 200, "currentUnitPrice": 220, "entryCurrency": "USD"}], "yearlyData": [], "financialProfile": {}, "displayCurrency": "SGD"}}' | jq '.message'

# Test 6: Non-Quick Query (should use OpenAI)
echo -e "\n6️⃣ Testing Non-Quick Query (should use OpenAI)"
curl -s -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"Add 100 shares of Apple at $150", "context": {"currentHoldings": [], "yearlyData": [], "financialProfile": {}, "displayCurrency": "SGD"}}' | jq '.action, .message'

echo -e "\n✅ Quick Queries Test Complete!"
echo -e "\n📊 Expected Results:"
echo "• Tests 1-5 should return quick responses without OpenAI API calls"
echo "• Test 6 should use OpenAI for complex intent recognition"
echo "• All responses should be fast and cost-effective" 