
export interface WeightedAverageResult {
  newQuantity: number;
  newAvgCostBasis: number;
  newTotalInvested: number;
  isNewHolding: boolean;
  existingData?: {
    currentQuantity: number;
    currentAvgPrice: number;
    currentTotalInvested: number;
  };
}

import { config } from './config';

// Currency conversion utility
async function getExchangeRates() {
  try {
    const baseUrl = config.BASE_URL;
    const response = await fetch(`${baseUrl}/api/exchange-rates`);
    if (!response.ok) throw new Error('Exchange rates API failed');
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Exchange rates fetch failed:', error);
    // Fallback rates
    return {
      USD_TO_SGD: 1.28,
      SGD_TO_USD: 0.78125,
      USD_TO_INR: 85.50,
      INR_TO_USD: 0.0117,
      SGD_TO_INR: 66.80,
      INR_TO_SGD: 0.0150
    };
  }
}

// Convert price from one currency to another
function convertPrice(price: number, fromCurrency: string, toCurrency: string, rates: any): number {
  if (fromCurrency === toCurrency) return price;
  
  const conversionKey = `${fromCurrency.toUpperCase()}_TO_${toCurrency.toUpperCase()}`;
  const rate = rates[conversionKey];
  
  if (!rate) {
    console.error(`No conversion rate found for ${conversionKey}`);
    return price; // Fallback to original price
  }
  
  return price * rate;
}

export async function calculateWeightedAverage(
  symbol: string,
  addedQuantity: number,
  addedUnitPrice: number,
  addedTotalCost: number,
  userCurrency: string = 'SGD' // NEW: User's selected currency
): Promise<WeightedAverageResult> {
  
  try {
    // Get exchange rates for currency conversion
    const rates = await getExchangeRates();
    
    // Use absolute URL for both browser and Node.js contexts
    const baseUrl = config.BASE_URL;
    const response = await fetch(`${baseUrl}/api/holdings`);
    
    if (!response.ok) {
      throw new Error(`Holdings API failed: ${response.status}`);
    }
    
    const holdings = await response.json();
    
    // Find existing holdings by symbol (case-insensitive) and pick best match
    const symbolMatches = holdings.filter((h: any) => 
      h.symbol.toUpperCase() === symbol.toUpperCase()
    );
    const existingHolding = symbolMatches.length > 0 ? 
      symbolMatches.sort((a: any, b: any) => (b.valueUSD || 0) - (a.valueUSD || 0))[0] : null;
    
    if (!existingHolding) {
      // New holding - round quantity
      return {
        newQuantity: Math.round(addedQuantity),
        newAvgCostBasis: addedUnitPrice,
        newTotalInvested: addedTotalCost,
        isNewHolding: true
      };
    }
    
    // Convert USD price to user's currency if needed
    const convertedUnitPrice = convertPrice(addedUnitPrice, 'USD', userCurrency, rates);
    
    // Calculate existing holding data with currency conversion
    const calculatedQuantity = existingHolding.valueUSD / (existingHolding.unitPrice || existingHolding.currentUnitPrice || 1);
    const currentQuantity = Number(existingHolding.quantity) || calculatedQuantity || 0;
    
    // Convert existing unit price to user currency
    const existingUnitPriceUSD = Number(existingHolding.unitPrice || existingHolding.currentUnitPrice) || 0;
    const currentUnitPrice = convertPrice(existingUnitPriceUSD, 'USD', userCurrency, rates);
    
    if (currentQuantity === 0 || currentUnitPrice === 0) {
      // Existing holding but no quantity/price data - treat as new
      return {
        newQuantity: Math.round(addedQuantity),
        newAvgCostBasis: convertedUnitPrice,
        newTotalInvested: addedTotalCost,
        isNewHolding: false,
        existingData: {
          currentQuantity: 0,
          currentAvgPrice: 0,
          currentTotalInvested: 0
        }
      };
    }
    
    // Calculate weighted average with currency conversion
    const currentTotalInvested = currentQuantity * currentUnitPrice;
    const newQuantity = currentQuantity + addedQuantity;
    const newTotalInvested = currentTotalInvested + addedTotalCost;
    const newAvgCostBasis = newTotalInvested / newQuantity;
    
    return {
      newQuantity: Math.round(newQuantity), // Round final quantity
      newAvgCostBasis: Math.round(newAvgCostBasis * 100) / 100, // Round to 2 decimal places
      newTotalInvested: Math.round(newTotalInvested * 100) / 100, // Round to 2 decimal places
      isNewHolding: false,
      existingData: {
        currentQuantity: Math.round(currentQuantity), // Round existing quantity
        currentAvgPrice: Math.round(currentUnitPrice * 100) / 100, // Round existing price
        currentTotalInvested: Math.round(currentTotalInvested * 100) / 100
      }
    };
    
  } catch (error) {
    console.error('Weighted average calculation error:', error);
    
    // Fallback to new holding if API fails
    return {
      newQuantity: Math.round(addedQuantity),
      newAvgCostBasis: addedUnitPrice,
      newTotalInvested: addedTotalCost,
      isNewHolding: true
    };
  }
}

export function calculateUnitsFromTotal(totalAmount: number, unitPrice: number): number {
  if (unitPrice <= 0) return 0;
  return totalAmount / unitPrice;
}

export function calculateTotalFromUnits(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

// Helper function to detect existing holdings for form pre-population
export async function findExistingHolding(symbol: string): Promise<any | null> {
  try {
    const baseUrl = config.BASE_URL;
    const response = await fetch(`${baseUrl}/api/holdings`);
    
    if (!response.ok) return null;
    
    const holdings = await response.json();
    return holdings.find((h: any) => 
      h.symbol.toUpperCase() === symbol.toUpperCase()
    ) || null;
    
  } catch (error) {
    console.error('Find existing holding error:', error);
    return null;
  }
}
