#!/bin/bash

echo "🧪 Testing Position Management Features"
echo "======================================"

BASE_URL="http://localhost:3000/api/agent"

# Test 1: Smart currency assumption
echo -e "\n1️⃣ Testing Smart Currency Assumption"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"add shares at $75"}' | jq '.data.entities.currency, .message'

# Test 2: Reduce holdings by half
echo -e "\n2️⃣ Testing Reduce Holdings by Half"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"Reduce my [COMPANY] holdings by half. I sold it at $115"}' | jq '.data.intent, .data.entities, .message'

# Test 3: Sell specific quantity
echo -e "\n3️⃣ Testing Sell Specific Quantity"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"Sell 10 shares of [SYMBOL] at $150"}' | jq '.data.intent, .data.entities, .message'

# Test 4: Add to existing position
echo -e "\n4️⃣ Testing Add to Existing Position"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"Buy 50 more shares of [SYMBOL] at $200"}' | jq '.data.intent, .data.entities, .message'

# Test 5: Currency correction
echo -e "\n5️⃣ Testing Currency Correction"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"Add 100 shares of VUAA at 50 SGD"}' | jq '.data.entities.currency, .message'

# Test 6: Misspelled symbol handling
echo -e "\n6️⃣ Testing Misspelled Symbol"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
         -d '{"message":"Sell 5 shares of [SYMBOL] at $100"}' | jq '.data.intent, .data.entities, .message'

# Test 7: Complex reduction
echo -e "\n7️⃣ Testing Complex Reduction"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"I want to reduce my NVIDIA position by 25 shares at current market price"}' | jq '.data.intent, .data.entities, .message'

echo -e "\n✅ Position Management Test Complete!"
echo "💡 Check OpenAI dashboard for usage: https://platform.openai.com/usage" 