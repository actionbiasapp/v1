const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseHolding() {
  try {
    console.log('🔍 Diagnosing holding discrepancy...\n');
    
    // Find the problematic holding
    const holding = await prisma.holdings.findFirst({
      where: {
        symbol: {
          contains: 'SGD-CASH'
        }
      },
      include: {
        category: true
      }
    });
    
    if (!holding) {
      console.log('❌ No holding found with SGD-CASH in symbol');
      return;
    }
    
    console.log('📊 Holding Details:');
    console.log(`Symbol: ${holding.symbol}`);
    console.log(`Name: ${holding.name}`);
    console.log(`Category: ${holding.category.name}`);
    console.log(`Entry Currency: ${holding.entryCurrency}`);
    console.log(`Location: ${holding.location}`);
    console.log(`Asset Type: ${holding.assetType || 'N/A'}`);
    console.log('');
    
    console.log('💰 Price Information:');
    console.log(`Quantity: ${holding.quantity || 'N/A'}`);
    console.log(`Unit Price (Buy): ${holding.unitPrice || 'N/A'} ${holding.entryCurrency}`);
    console.log(`Current Unit Price: ${holding.currentUnitPrice || 'N/A'} ${holding.entryCurrency}`);
    console.log('');
    
    console.log('💵 Stored Values:');
    console.log(`Value SGD: ${holding.valueSGD}`);
    console.log(`Value USD: ${holding.valueUSD}`);
    console.log(`Value INR: ${holding.valueINR}`);
    console.log('');
    
    // Calculate what the values should be
    console.log('🧮 Calculated Values:');
    if (holding.quantity && holding.unitPrice) {
      const buyValue = holding.quantity * holding.unitPrice;
      console.log(`Buy Value (quantity × unitPrice): ${buyValue} ${holding.entryCurrency}`);
    }
    
    if (holding.quantity && holding.currentUnitPrice) {
      const currentValue = holding.quantity * holding.currentUnitPrice;
      console.log(`Current Value (quantity × currentUnitPrice): ${currentValue} ${holding.entryCurrency}`);
    }
    
    if (holding.quantity && holding.unitPrice && holding.currentUnitPrice) {
      const profitLoss = (holding.currentUnitPrice - holding.unitPrice) * holding.quantity;
      const profitPercent = ((holding.currentUnitPrice - holding.unitPrice) / holding.unitPrice) * 100;
      console.log(`Profit/Loss: ${profitLoss} ${holding.entryCurrency} (${profitPercent.toFixed(2)}%)`);
    }
    console.log('');
    
    // Check if there are any other similar holdings
    const similarHoldings = await prisma.holdings.findMany({
      where: {
        symbol: {
          contains: 'CASH'
        }
      },
      select: {
        symbol: true,
        quantity: true,
        unitPrice: true,
        currentUnitPrice: true,
        valueSGD: true,
        entryCurrency: true
      }
    });
    
    console.log('🔍 All Cash Holdings:');
    similarHoldings.forEach(h => {
      console.log(`${h.symbol}: qty=${h.quantity}, buy=${h.unitPrice}, current=${h.currentUnitPrice}, stored=${h.valueSGD} ${h.entryCurrency}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseHolding(); 