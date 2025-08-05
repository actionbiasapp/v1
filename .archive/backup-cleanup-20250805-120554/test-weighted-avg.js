// Test weighted average calculation
function calculateWeightedAverage(existingQuantity, existingUnitPrice, newQuantity, newUnitPrice) {
  const existingCostBasis = existingQuantity * existingUnitPrice;
  const newCostBasis = newQuantity * newUnitPrice;
  const totalQuantity = existingQuantity + newQuantity;
  const totalCostBasis = existingCostBasis + newCostBasis;
  const weightedAveragePrice = totalCostBasis / totalQuantity;
  
  console.log('Weighted Average Calculation:');
  console.log('Existing:', existingQuantity, 'shares at $', existingUnitPrice, '= $', existingCostBasis);
  console.log('New:', newQuantity, 'shares at $', newUnitPrice, '= $', newCostBasis);
  console.log('Total:', totalQuantity, 'shares, total cost $', totalCostBasis);
  console.log('Weighted Average Price: $', weightedAveragePrice.toFixed(2));
  
  return weightedAveragePrice;
}

// Test with IREN data
// Current state: 700 shares, unit price $4.4, cost basis $3078
// This means: 700 * 4.4 = 3080 (close to 3078, so this seems correct)

// Let's test what happens if we add 200 shares at different prices
console.log('=== Test 1: Adding 200 shares at $15 (current market price) ===');
calculateWeightedAverage(500, 4.4, 200, 15);

console.log('\n=== Test 2: Adding 200 shares at $10 ===');
calculateWeightedAverage(500, 4.4, 200, 10);

console.log('\n=== Test 3: Adding 200 shares at $5 ===');
calculateWeightedAverage(500, 4.4, 200, 5);

console.log('\n=== Test 4: Reverse engineering from current state ===');
// If we have 700 shares at $4.4, and we added 200 shares at some price
// Let's work backwards to find what price the 200 shares were added at
const currentTotalCost = 700 * 4.4; // 3080
const originalQuantity = 500;
const originalUnitPrice = 4.4; // Assuming this was the original price
const originalCost = originalQuantity * originalUnitPrice; // 2200
const newCost = currentTotalCost - originalCost; // 880
const newQuantity = 200;
const newUnitPrice = newCost / newQuantity; // 4.4

console.log('Reverse engineering:');
console.log('Current total cost: $', currentTotalCost);
console.log('Original cost (500 shares): $', originalCost);
console.log('New cost (200 shares): $', newCost);
console.log('New unit price: $', newUnitPrice);

// This suggests the 200 shares were added at $4.4, which seems wrong
// Let me check if the original holding was 500 shares or something else 