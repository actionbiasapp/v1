#!/usr/bin/env node
// Manual Current Price Update for Holdings Skipped by Cron
// Updates the 9 holdings that the automatic price update doesn't cover

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Current prices for holdings skipped by cron (from your spreadsheet data)
const manualPriceUpdates = [
  // India Holdings (INR prices from your spreadsheet)
  {
    symbol: 'SETNIF50',
    currentUnitPrice: 267.07,     // INR per unit (current market price)
    priceSource: 'manual',
    note: 'India ETF - manual update from spreadsheet'
  },
  {
    symbol: 'SETFNN50', 
    currentUnitPrice: 723.73,     // INR per unit (current market price)
    priceSource: 'manual',
    note: 'India ETF - manual update from spreadsheet'
  },
  {
    symbol: 'HDFC-FOCUS',
    currentUnitPrice: 228.45,     // INR per unit (current market price)
    priceSource: 'manual', 
    note: 'India Mutual Fund - manual update from spreadsheet'
  },
  
  // Physical Assets (SGD prices)
  {
    symbol: 'GOLD',
    currentUnitPrice: 109.38,     // SGD per gram (current gold price)
    priceSource: 'manual',
    note: 'Physical Gold - manual update from spreadsheet'
  },
  
  // Cash Holdings (no price change - stable)
  {
    symbol: 'SGD-CASH',
    currentUnitPrice: 44000.00,   // SGD (cash = same as cost)
    priceSource: 'manual',
    note: 'Cash - stable value'
  },
  {
    symbol: 'SGD-CASH-2',
    currentUnitPrice: 15000.00,   // SGD (cash = same as cost)
    priceSource: 'manual',
    note: 'Cash - stable value'
  },
  {
    symbol: 'SGD-CASH-3',
    currentUnitPrice: 19000.00,   // SGD (cash = same as cost)
    priceSource: 'manual',
    note: 'Cash - stable value'
  },
  
  // Stablecoins (USD - always $1.00)
  {
    symbol: 'USDC',
    currentUnitPrice: 1.00,       // USD (stablecoin = $1)
    priceSource: 'manual',
    note: 'Stablecoin - $1.00 peg'
  },
  {
    symbol: 'USDC-2',
    currentUnitPrice: 1.00,       // USD (stablecoin = $1)
    priceSource: 'manual',
    note: 'Stablecoin - $1.00 peg'
  }
];

async function updateManualPrices(mode = 'dry-run') {
  console.log(`🔧 Manual Price Update - ${mode} mode\n`);
  
  try {
    for (const update of manualPriceUpdates) {
      // Find the holding
      const holding = await prisma.holdings.findFirst({
        where: { symbol: update.symbol }
      });
      
      if (!holding) {
        console.log(`❌ ${update.symbol}: Not found in database`);
        continue;
      }
      
      const costBasis = Number(holding.quantity) * Number(holding.unitPrice);
      const currentValue = Number(holding.quantity) * update.currentUnitPrice;
      const gain = currentValue - costBasis;
      const gainPercent = ((gain / costBasis) * 100).toFixed(2);
      
      if (mode === 'dry-run') {
        console.log(`📊 ${update.symbol}:`);
        console.log(`   Cost: ${holding.quantity} @ ${holding.entryCurrency} ${holding.unitPrice} = ${holding.entryCurrency} ${costBasis.toFixed(2)}`);
        console.log(`   Current: ${holding.quantity} @ ${holding.entryCurrency} ${update.currentUnitPrice} = ${holding.entryCurrency} ${currentValue.toFixed(2)}`);
        console.log(`   Gain: ${holding.entryCurrency} ${gain.toFixed(2)} (${gainPercent}%)`);
        console.log(`   Note: ${update.note}\n`);
      } else if (mode === 'execute') {
        // Update the database
        await prisma.holdings.update({
          where: { id: holding.id },
          data: {
            currentUnitPrice: update.currentUnitPrice,
            priceSource: update.priceSource,
            priceUpdated: new Date()
          }
        });
        
        console.log(`✅ Updated ${update.symbol}: ${holding.entryCurrency} ${update.currentUnitPrice} (${gainPercent}% gain)`);
      }
    }
    
    if (mode === 'dry-run') {
      console.log('🔄 Run with --execute to apply these price updates');
    } else {
      console.log(`\n✅ Manual price updates completed for ${manualPriceUpdates.length} holdings`);
    }
    
  } catch (error) {
    console.error('❌ Error updating manual prices:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
const mode = process.argv[2];

switch (mode) {
  case '--dry-run':
    updateManualPrices('dry-run');
    break;
  case '--execute':
    updateManualPrices('execute');
    break;
  default:
    console.log('📚 Manual Price Update Script:');
    console.log('  --dry-run    Preview price updates');
    console.log('  --execute    Apply price updates');
    console.log('\n💡 Updates 9 holdings skipped by automatic cron');
    break;
}
