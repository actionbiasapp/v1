#!/bin/bash

echo "🧪 Testing Company Reduction Scenario"
echo "======================================"

BASE_URL="http://localhost:3000/api/agent"

# Test 1: Initial recognition with correct symbol
echo -e "\n1️⃣ Testing Initial Recognition"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"Reduce my [COMPANY] holdings by half. I sold it at $115", "context": {"currentHoldings": [{"symbol": "[SYMBOL]", "quantity": 40, "name": "[COMPANY] Inc"}], "yearlyData": [], "financialProfile": {}, "displayCurrency": "SGD"}}' | jq '.data.entities, .message'

# Test 2: Execute the reduction
echo -e "\n2️⃣ Testing Execution"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"action": {"type": "reduce_holding", "data": {"symbol": "[SYMBOL]", "quantity": 20, "unitPrice": 115, "currency": "USD"}}}' | jq '.success, .message'

# Test 3: Verify the result
echo -e "\n3️⃣ Verifying Result"
curl -s http://localhost:3000/api/holdings | jq '.[] | select(.symbol == "[SYMBOL]") | {symbol: .symbol, quantity: .quantity, name: .name}'

echo -e "\n✅ Company Reduction Test Complete!" 