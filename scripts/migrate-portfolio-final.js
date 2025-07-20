#!/usr/bin/env node
// Corrected Portfolio Migration Script - Final Accurate Data
// Based on corrected CSV with accurate cost basis and categories

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// FINAL CORRECTED portfolio data from your spreadsheet
const portfolioData = {
  core: [
    {
      symbol: 'VUAA.L',
      name: 'Vanguard S&P 500 UCITS ETF',
      quantity: 350,
      unitPrice: 63.10,        // CORRECTED: Was 114.68, now reflects true average
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'S27.SI',
      name: 'SPDR S&P 500 ETF',
      quantity: 12,
      unitPrice: 630.00,
      entryCurrency: 'USD',
      location: 'SRS'
    },
    {
      symbol: 'SETNIF50',
      name: 'SBI Nifty 50 ETF',
      quantity: 6681,
      unitPrice: 114.69,       // INR per unit (actual purchase price)
      entryCurrency: 'INR',
      location: 'ICICI Direct'
    },
    {
      symbol: 'SETFNN50',
      name: 'SBI Next 50 ETF',
      quantity: 2733,
      unitPrice: 281.32,       // INR per unit (actual purchase price)
      entryCurrency: 'INR',
      location: 'ICICI Direct'
    },
    {
      symbol: 'HDFC-FOCUS',
      name: 'HDFC Focused Fund - Regular (G)',
      quantity: 2362,
      unitPrice: 211.45,       // INR per unit (calculated from your data)
      entryCurrency: 'INR',
      location: 'ICICI Direct'
    }
  ],
  
  growth: [
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      quantity: 100,
      unitPrice: 112.04,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc',
      quantity: 50,
      unitPrice: 306.33,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'GOOG',
      name: 'Alphabet Inc Class C',
      quantity: 80,
      unitPrice: 160.81,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc',
      quantity: 30,
      unitPrice: 214.33,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc',
      quantity: 30,
      unitPrice: 201.61,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'UNH',
      name: 'UnitedHealth Group Inc',
      quantity: 20,
      unitPrice: 298.34,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'CRCL',
      name: 'Circle Internet Group Inc',
      quantity: 25,
      unitPrice: 209.82,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'ASML',
      name: 'ASML Holding NV',
      quantity: 7,
      unitPrice: 733.04,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'HIMS',
      name: 'Hims & Hers Health Inc',
      quantity: 100,
      unitPrice: 42.42,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'CRWV',
      name: 'CoreWeave Inc',
      quantity: 40,
      unitPrice: 134.21,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'IREN',
      name: 'Iris Energy Limited',
      quantity: 200,
      unitPrice: 10.39,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      quantity: 23,
      unitPrice: 1993.43,      // SGD per unit (actual purchase price)
      entryCurrency: 'SGD',
      location: 'CoinGecko'
    }
  ],
  
  hedge: [
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      quantity: 0.12,
      unitPrice: 62043.80,     // SGD per unit (actual purchase price)
      entryCurrency: 'SGD',
      location: 'CoinGecko'
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 0.06,
      unitPrice: 61834.98,     // SGD per unit (actual purchase price)
      entryCurrency: 'SGD',
      location: 'CoinGecko'
    },
    {
      symbol: 'GLD',
      name: 'SPDR Gold Trust',
      quantity: 25,
      unitPrice: 305.49,
      entryCurrency: 'USD',
      location: 'IBKR'
    },
    {
      symbol: 'GOLD',
      name: 'Physical Gold',
      quantity: 103,
      unitPrice: 79.30,        // SGD per gram (actual purchase price)
      entryCurrency: 'SGD',
      location: 'Physical'
    }
  ],
  
  liquidity: [
    {
      symbol: 'SGD-CASH',
      name: 'Standard Chartered Cash',
      quantity: 1,
      unitPrice: 44000.00,     // SGD actual amount
      entryCurrency: 'SGD',
      location: 'Standard Chartered'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin (Aave)',
      quantity: 23692,
      unitPrice: 1.00,
      entryCurrency: 'USD',
      location: 'Aave'
    },
    {
      symbol: 'SGD-CASH-2',
      name: 'IBKR Cash',
      quantity: 1,
      unitPrice: 15000.00,     // SGD actual amount
      entryCurrency: 'SGD',
      location: 'IBKR'
    },
    {
      symbol: 'SGD-CASH-3',
      name: 'DBS Bank Cash',
      quantity: 1,
      unitPrice: 19000.00,     // SGD actual amount
      entryCurrency: 'SGD',
      location: 'DBS'
    },
    {
      symbol: 'USDC-2',
      name: 'USD Coin (Ledger)',
      quantity: 6839,
      unitPrice: 1.00,
      entryCurrency: 'USD',
      location: 'Ledger'
    }
  ]
};

// Exchange rates for conversion (based on your data)
const EXCHANGE_RATES = {
  USD_TO_SGD: 1.28,
  INR_TO_SGD: 0.0149,      // Based on your INR data
  SGD_TO_USD: 0.78125,     // 1/1.28
  SGD_TO_INR: 67.11,       // Reverse of INR_TO_SGD
  USD_TO_INR: 86.0,        // Based on your exchange rate column
  INR_TO_USD: 0.0116       // 1/86
};

// Convert values to all currencies
function convertToCurrencies(amount, fromCurrency) {
  if (fromCurrency === 'SGD') {
    return {
      SGD: amount,
      USD: amount * EXCHANGE_RATES.SGD_TO_USD,
      INR: amount * EXCHANGE_RATES.SGD_TO_INR
    };
  } else if (fromCurrency === 'USD') {
    return {
      SGD: amount * EXCHANGE_RATES.USD_TO_SGD,
      USD: amount,
      INR: amount * EXCHANGE_RATES.USD_TO_INR
    };
  } else if (fromCurrency === 'INR') {
    return {
      SGD: amount * EXCHANGE_RATES.INR_TO_SGD,
      USD: amount * EXCHANGE_RATES.INR_TO_USD,
      INR: amount
    };
  }
}

// Get category ID by name
async function getCategoryId(categoryName) {
  const category = await prisma.assetCategory.findFirst({
    where: { name: { equals: categoryName, mode: 'insensitive' } }
  });
  
  if (!category) {
    throw new Error(`Category '${categoryName}' not found. Available categories: core, growth, hedge, liquidity`);
  }
  
  return category.id;
}

// Get first user ID (assuming single user for now)
async function getUserId() {
  const user = await prisma.user.findFirst();
  if (!user) {
    throw new Error('No user found. Please create a user first.');
  }
  return user.id;
}

// Backup current holdings
async function backupHoldings() {
  console.log('📦 Creating backup of current holdings...');
  
  const currentHoldings = await prisma.holdings.findMany({
    include: {
      category: true,
      user: true
    }
  });
  
  const backupPath = path.join(__dirname, `../backups/holdings-backup-corrected-${Date.now()}.json`);
  
  // Create backups directory if it doesn't exist
  try {
    await fs.mkdir(path.join(__dirname, '../backups'), { recursive: true });
  } catch (error) {
    // Directory already exists
  }
  
  await fs.writeFile(backupPath, JSON.stringify(currentHoldings, null, 2));
  
  console.log(`✅ Backup saved: ${backupPath}`);
  console.log(`📊 Backed up ${currentHoldings.length} holdings`);
  
  return backupPath;
}

// Prepare holdings data for database insertion
async function prepareHoldingsData() {
  const userId = await getUserId();
  const categoryIds = {
    core: await getCategoryId('core'),
    growth: await getCategoryId('growth'),
    hedge: await getCategoryId('hedge'),
    liquidity: await getCategoryId('liquidity')
  };
  
  const allHoldings = [];
  
  for (const [categoryName, holdings] of Object.entries(portfolioData)) {
    for (const holding of holdings) {
      const totalValue = holding.quantity * holding.unitPrice;
      const currencies = convertToCurrencies(totalValue, holding.entryCurrency);
      
      const holdingData = {
        userId: userId,
        categoryId: categoryIds[categoryName],
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        unitPrice: holding.unitPrice,
        costBasis: totalValue,
        valueSGD: currencies.SGD,
        valueUSD: currencies.USD,
        valueINR: currencies.INR,
        entryCurrency: holding.entryCurrency,
        location: holding.location,
        updatedAt: new Date()
      };
      
      allHoldings.push(holdingData);
    }
  }
  
  return allHoldings;
}

// Main migration function
async function runMigration(mode = 'dry-run') {
  console.log(`🚀 Starting CORRECTED portfolio migration in ${mode} mode...\n`);
  
  try {
    // Always create backup first
    if (mode !== 'dry-run') {
      await backupHoldings();
    }
    
    const holdingsData = await prepareHoldingsData();
    
    if (mode === 'dry-run') {
      console.log('📋 DRY RUN - Preview of CORRECTED migration:');
      console.log(`📊 Total holdings to migrate: ${holdingsData.length}`);
      console.log('\n📈 Sample holdings with corrections:');
      
      // Show key corrections
      const vuaa = holdingsData.find(h => h.symbol === 'VUAA.L');
      if (vuaa) {
        console.log(`  ✅ VUAA.L: ${vuaa.quantity} @ USD ${vuaa.unitPrice} (CORRECTED from $114.68)`);
      }
      
      const eth = holdingsData.find(h => h.symbol === 'ETH');
      if (eth) {
        console.log(`  ✅ ETH: ${eth.quantity} @ SGD ${eth.unitPrice} (Growth category)`);
      }
      
      const btc = holdingsData.find(h => h.symbol === 'BTC');
      if (btc) {
        console.log(`  ✅ BTC: ${btc.quantity} @ SGD ${btc.unitPrice} (Hedge category)`);
      }
      
      console.log('\n📊 Holdings by category:');
      const categoryCounts = {};
      holdingsData.forEach(h => {
        const categoryName = Object.keys(portfolioData).find(cat => 
          portfolioData[cat].some(holding => holding.symbol === h.symbol)
        );
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });
      
      Object.entries(categoryCounts).forEach(([cat, count]) => {
        console.log(`  ${cat.toUpperCase()}: ${count} holdings`);
      });
      
      console.log('\n🔄 Run with --execute to perform actual migration');
      return;
    }
    
    if (mode === 'backup-only') {
      console.log('✅ Backup completed successfully');
      return;
    }
    
    if (mode === 'execute') {
      console.log('💾 FULL CORRECTED MIGRATION - Clearing and rebuilding entire portfolio...');
      
      // Delete all existing holdings
      const deleteResult = await prisma.holdings.deleteMany({});
      console.log(`🗑️ Deleted ${deleteResult.count} existing holdings`);
      
      // Insert all corrected holdings
      let created = 0;
      for (const holding of holdingsData) {
        await prisma.holdings.create({ data: holding });
        created++;
        if (created % 5 === 0) {
          console.log(`📈 Created ${created}/${holdingsData.length} holdings...`);
        }
      }
      
      console.log(`\n✅ CORRECTED migration completed - ${created} holdings created`);
      console.log('🎉 Portfolio migration successful with accurate data!');
      
      // Show summary
      console.log('\n📊 Final Portfolio Summary:');
      console.log(`- Core: 5 holdings (including corrected VUAA.L)`);
      console.log(`- Growth: 12 holdings (ETH in growth)`);
      console.log(`- Hedge: 4 holdings (BTC/WBTC moved here)`);
      console.log(`- Liquidity: 5 holdings (cash/stablecoins)`);
      console.log(`- Total: ${created} holdings with accurate cost basis`);
      
      return;
    }
    
  } catch (error) {
    console.error('❌ Corrected migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
const mode = process.argv[2];

switch (mode) {
  case '--dry-run':
    runMigration('dry-run');
    break;
  case '--backup-only':
    runMigration('backup-only');
    break;
  case '--execute':
    runMigration('execute');
    break;
  default:
    console.log('📚 CORRECTED Portfolio Migration Script Usage:');
    console.log('  --dry-run      Preview corrected migration (no changes)');
    console.log('  --backup-only  Create backup only');
    console.log('  --execute      Full corrected migration (USE WITH CAUTION)');
    console.log('\n🔥 Key corrections: VUAA.L cost basis, category assignments');
    console.log('💡 Always test first with --dry-run');
    break;
}
