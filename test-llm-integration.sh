#!/bin/bash

echo "🧪 Testing LLM Integration - Comprehensive Test Suite"
echo "=================================================="

BASE_URL="http://localhost:3000/api/agent"

# Test 1: Simple fallback (should not use LLM)
echo -e "\n1️⃣ Testing Simple Fallback (No API Cost)"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' | jq '.message'

# Test 2: Your original use case
echo -e "\n2️⃣ Testing Original Use Case"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"2023 income was $120,000"}' | jq '.data.intent, .data.entities, .message'

# Test 3: Single holding addition
echo -e "\n3️⃣ Testing Single Holding Addition"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"Add 100 shares of [SYMBOL] at $150"}' | jq '.data.intent, .data.entities, .message'

# Test 4: Natural language variations
echo -e "\n4️⃣ Testing Natural Language Variations"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"I earned $150,000 in 2024 and spent $80,000 on expenses"}' | jq '.data.intent, .data.entities, .message'

# Test 5: Portfolio analysis
echo -e "\n5️⃣ Testing Portfolio Analysis"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"How is my portfolio performing?"}' | jq '.data.intent, .message'

# Test 6: Complex multi-data input
echo -e "\n6️⃣ Testing Complex Multi-Data Input"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"2024 was a good year - I made $200k, spent $100k, and my net worth is now $500k"}' | jq '.data.intent, .data.entities, .message'

# Test 7: Ambiguous input (should ask for clarification)
echo -e "\n7️⃣ Testing Ambiguous Input"
curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{"message":"I want to add some stocks"}' | jq '.action, .message'

echo -e "\n✅ Test Suite Complete!"
echo "💡 Check OpenAI dashboard for usage: https://platform.openai.com/usage" 