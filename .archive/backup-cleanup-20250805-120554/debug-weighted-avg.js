// Debug weighted average calculation for IREN
console.log('=== IREN Weighted Average Debug ===');

// Current state after adding 200 shares
const currentQuantity = 700;
const currentUnitPrice = 4.4;
const currentCostBasis = 3078;

console.log('Current State:');
console.log('Quantity:', currentQuantity);
console.log('Unit Price:', currentUnitPrice);
console.log('Cost Basis:', currentCostBasis);
console.log('Verification: 700 * 4.4 =', 700 * 4.4, '(should be close to 3078)');

// Let's work backwards to find what the original holding was
// and what price the 200 shares were added at

console.log('\n=== Reverse Engineering ===');

// If we assume the original holding was 500 shares
const originalQuantity = 500;
const originalUnitPrice = 4.4; // Let's assume this was the original price
const originalCostBasis = originalQuantity * originalUnitPrice;

console.log('Assumed Original:');
console.log('Quantity:', originalQuantity);
console.log('Unit Price:', originalUnitPrice);
console.log('Cost Basis:', originalCostBasis);

// Calculate what the 200 new shares cost
const newQuantity = 200;
const newCostBasis = currentCostBasis - originalCostBasis;
const newUnitPrice = newCostBasis / newQuantity;

console.log('\nCalculated New Shares:');
console.log('Quantity:', newQuantity);
console.log('Cost Basis:', newCostBasis);
console.log('Unit Price:', newUnitPrice);

// This suggests the 200 shares were added at $4.4, which seems wrong
// Let me try different scenarios

console.log('\n=== Different Scenarios ===');

// Scenario 1: Original was 500 shares at $4.4, added 200 at $15
console.log('Scenario 1: Original 500@$4.4 + 200@$15');
const scenario1Original = 500 * 4.4; // 2200
const scenario1New = 200 * 15; // 3000
const scenario1Total = scenario1Original + scenario1New; // 5200
const scenario1Quantity = 500 + 200; // 700
const scenario1Avg = scenario1Total / scenario1Quantity; // 7.43
console.log('Expected Average:', scenario1Avg.toFixed(2));

// Scenario 2: Original was 500 shares at $4.4, added 200 at $10
console.log('Scenario 2: Original 500@$4.4 + 200@$10');
const scenario2Original = 500 * 4.4; // 2200
const scenario2New = 200 * 10; // 2000
const scenario2Total = scenario2Original + scenario2New; // 4200
const scenario2Quantity = 500 + 200; // 700
const scenario2Avg = scenario2Total / scenario2Quantity; // 6.00
console.log('Expected Average:', scenario2Avg.toFixed(2));

// Scenario 3: Original was 500 shares at $4.4, added 200 at $5
console.log('Scenario 3: Original 500@$4.4 + 200@$5');
const scenario3Original = 500 * 4.4; // 2200
const scenario3New = 200 * 5; // 1000
const scenario3Total = scenario3Original + scenario3New; // 3200
const scenario3Quantity = 500 + 200; // 700
const scenario3Avg = scenario3Total / scenario3Quantity; // 4.57
console.log('Expected Average:', scenario3Avg.toFixed(2));

console.log('\n=== Current State Analysis ===');
console.log('Current average is $4.4, which suggests:');
console.log('- Either the original holding was different than 500 shares');
console.log('- Or the 200 shares were added at a very low price');
console.log('- Or there\'s a bug in the calculation');

// Let me check what the original holding might have been
// If we have 700 shares at $4.4 = 3080 cost basis
// But the actual cost basis is 3078, which is very close

console.log('\n=== Alternative Original Scenarios ===');

// What if the original was 500 shares at a different price?
// Let's say original was 500 shares at $4.0
const altOriginalQuantity = 500;
const altOriginalUnitPrice = 4.0;
const altOriginalCostBasis = altOriginalQuantity * altOriginalUnitPrice; // 2000

// Then 200 new shares would need to cost: 3078 - 2000 = 1078
// So 200 shares at $5.39 each
const altNewCostBasis = 3078 - altOriginalCostBasis; // 1078
const altNewUnitPrice = altNewCostBasis / 200; // 5.39

console.log('Alternative Scenario:');
console.log('Original: 500 shares at $4.0 = $2000');
console.log('New: 200 shares at $5.39 = $1078');
console.log('Total: 700 shares at $4.4 = $3078');
console.log('This makes more sense!'); 