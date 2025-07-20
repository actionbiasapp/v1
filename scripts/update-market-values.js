const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Exchange rates for conversion
const RATES = { USD_TO_SGD: 1.28, INR_TO_SGD: 0.0149, SGD_TO_USD: 0.78125 };

async function updateCurrentMarketValues() {
  try {
    const holdings = await prisma.holdings.findMany();
    
    console.log('=== UPDATING CURRENT MARKET VALUES ===');
    let newTotalSGD = 0;
    
    for (const h of holdings) {
      if (!h.currentUnitPrice) {
        console.log(`⚠️ ${h.symbol}: No current price, keeping cost basis`);
        newTotalSGD += Number(h.valueSGD);
        continue;
      }
      
      // Calculate current market value in original currency
      const currentValue = Number(h.quantity) * Number(h.currentUnitPrice);
      
      // Convert to all currencies
      let newValueSGD, newValueUSD, newValueINR;
      
      if (h.entryCurrency === 'SGD') {
        newValueSGD = currentValue;
        newValueUSD = currentValue * RATES.SGD_TO_USD;
        newValueINR = currentValue / RATES.INR_TO_SGD;
      } else if (h.entryCurrency === 'USD') {
        newValueSGD = currentValue * RATES.USD_TO_SGD;
        newValueUSD = currentValue;
        newValueINR = currentValue * 86;
      } else if (h.entryCurrency === 'INR') {
        newValueSGD = currentValue * RATES.INR_TO_SGD;
        newValueUSD = currentValue / 86;
        newValueINR = currentValue;
      }
      
      // Update database with current market values
      await prisma.holdings.update({
        where: { id: h.id },
        data: {
          valueSGD: newValueSGD,
          valueUSD: newValueUSD,
          valueINR: newValueINR
        }
      });
      
      newTotalSGD += newValueSGD;
      console.log(`✅ ${h.symbol}: SGD ${Number(h.valueSGD).toFixed(0)} → SGD ${newValueSGD.toFixed(0)}`);
    }
    
    console.log('\n=== RESULTS ===');
    console.log(`New Total SGD: ${newTotalSGD.toFixed(0)}`);
    console.log(`Expected: ~522,529`);
    console.log(`Difference: ${(newTotalSGD - 522529).toFixed(0)}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCurrentMarketValues();
