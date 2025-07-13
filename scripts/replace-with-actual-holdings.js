// scripts/replace-with-actual-holdings.js
// Replace sample data with actual portfolio holdings

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// IBKR conversion rate from your actual data
const IBKR_USD_TO_SGD = 1.2798;

// Exchange rates based on your actual IBKR data
const ACTUAL_EXCHANGE_RATES = {
  SGD_TO_USD: 0.7814,  // 1 / 1.2798
  SGD_TO_INR: 63.0,
  USD_TO_SGD: 1.2798,  // From your IBKR data
  USD_TO_INR: 80.58,   // 63.0 * 1.2798
  INR_TO_SGD: 0.0159,  // 1 / 63.0
  INR_TO_USD: 0.0124   // 1 / 80.58
};

// Your actual portfolio holdings
const ACTUAL_HOLDINGS = [
  // CORE CATEGORY
  {
    symbol: 'VUAA.L',
    name: 'Vanguard S&P 500 UCITS ETF',
    valueUSD: 41909,
    valueSGD: 53620, // Using IBKR conversion
    valueINR: 53620 * 63.0, // SGD to INR
    entryCurrency: 'USD',
    category: 'Core',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'NIFTY100',
    name: 'India Equities (Nifty 100)',
    valueUSD: 50000,
    valueSGD: 64000,
    valueINR: 64000 * 63.0,
    entryCurrency: 'SGD',
    category: 'Core',
    location: 'India',
    quantity: null,
    costBasis: null
  },
  
  // GROWTH CATEGORY
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    valueUSD: 16448,
    valueSGD: 21055,
    valueINR: 21055 * 63.0,
    entryCurrency: 'USD',
    category: 'Growth',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc',
    valueUSD: 14949,
    valueSGD: 19137,
    valueINR: 19137 * 63.0,
    entryCurrency: 'USD',
    category: 'Growth',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc Class A',
    valueUSD: 14185,
    valueSGD: 18160,
    valueINR: 18160 * 63.0,
    entryCurrency: 'USD',
    category: 'Growth',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc',
    valueUSD: 6303,
    valueSGD: 8065,
    valueINR: 8065 * 63.0,
    entryCurrency: 'USD',
    category: 'Growth',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'UNH',
    name: 'UnitedHealth Group Inc',
    valueUSD: 6057,
    valueSGD: 7750,
    valueINR: 7750 * 63.0,
    entryCurrency: 'USD',
    category: 'Growth',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'CRM',
    name: 'Salesforce Inc',
    valueUSD: 5410,
    valueSGD: 6923,
    valueINR: 6923 * 63.0,
    entryCurrency: 'USD',
    category: 'Growth',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'HIMS',
    name: 'Hims & Hers Health Inc',
    valueUSD: 5105,
    valueSGD: 6532,
    valueINR: 6532 * 63.0,
    entryCurrency: 'USD',
    category: 'Growth',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc',
    valueUSD: 4435,
    valueSGD: 5676,
    valueINR: 5676 * 63.0,
    entryCurrency: 'USD',
    category: 'Growth',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'IREN',
    name: 'Iris Energy Limited',
    valueUSD: 3350,
    valueSGD: 4287,
    valueINR: 4287 * 63.0,
    entryCurrency: 'USD',
    category: 'Growth',
    location: 'IBKR',
    quantity: null,
    costBasis: null
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    valueUSD: 69756,
    valueSGD: 89295,
    valueINR: 89295 * 63.0,
    entryCurrency: 'SGD',
    category: 'Growth',
    location: 'CoinGecko',
    quantity: 25.16,
    costBasis: null
  },
  
  // HEDGE CATEGORY
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    valueUSD: 13506,
    valueSGD: 17281,
    valueINR: 17281 * 63.0,
    entryCurrency: 'SGD',
    category: 'Hedge',
    location: 'CoinGecko',
    quantity: 0.1218,
    costBasis: null
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    valueUSD: 6605,
    valueSGD: 8455,
    valueINR: 8455 * 63.0,
    entryCurrency: 'SGD',
    category: 'Hedge',
    location: 'CoinGecko',
    quantity: 0.05959,
    costBasis: null
  },
  {
    symbol: 'GOLD',
    name: 'Physical Gold',
    valueUSD: 10938,
    valueSGD: 14000,
    valueINR: 14000 * 63.0,
    entryCurrency: 'SGD',
    category: 'Hedge',
    location: 'Physical',
    quantity: null,
    costBasis: null
  },
  
  // LIQUIDITY CATEGORY
  {
    symbol: 'IBKR-CASH',
    name: 'IBKR Cash (SGD + USD)',
    valueUSD: 31886,
    valueSGD: 40832,
    valueINR: 40832 * 63.0,
    entryCurrency: 'SGD',
    category: 'Liquidity',
    location: 'IBKR',
    quantity: 40832,
    costBasis: 40832
  },
  {
    symbol: 'DBS-CASH',
    name: 'DBS Bank Cash',
    valueUSD: 23438,
    valueSGD: 30000,
    valueINR: 30000 * 63.0,
    entryCurrency: 'SGD',
    category: 'Liquidity',
    location: 'DBS Bank',
    quantity: 30000,
    costBasis: 30000
  },
  {
    symbol: 'SC-CASH',
    name: 'Standard Chartered Cash',
    valueUSD: 34375,
    valueSGD: 44000,
    valueINR: 44000 * 63.0,
    entryCurrency: 'SGD',
    category: 'Liquidity',
    location: 'Standard Chartered',
    quantity: 44000,
    costBasis: 44000
  },
  {
    symbol: 'USDC',
    name: 'USDC on Aave',
    valueUSD: 23692,
    valueSGD: 30321,
    valueINR: 30321 * 63.0,
    entryCurrency: 'USD',
    category: 'Liquidity',
    location: 'Aave',
    quantity: 23692,
    costBasis: 23692
  }
];

async function replaceWithActualHoldings() {
  try {
    console.log('🔄 Replacing sample holdings with actual portfolio data...');
    
    // 1. Get existing user and categories (preserve them)
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No user found. Please run the initial setup script first.');
      return;
    }
    
    const categories = await prisma.assetCategory.findMany({
      where: { userId: user.id }
    });
    
    if (categories.length === 0) {
      console.error('❌ No categories found. Please run the initial setup script first.');
      return;
    }
    
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    console.log(`✅ Found user: ${user.name}`);
    console.log(`✅ Found categories: ${Object.keys(categoryMap).join(', ')}`);
    
    // 2. Update exchange rates to match your IBKR rates
    console.log('💱 Updating exchange rates to match IBKR...');
    
    // Delete existing rates and add IBKR-accurate rates
    await prisma.exchangeRate.deleteMany({});
    
    const rateUpdates = [
      { fromCurrency: 'SGD', toCurrency: 'USD', rate: ACTUAL_EXCHANGE_RATES.SGD_TO_USD },
      { fromCurrency: 'SGD', toCurrency: 'INR', rate: ACTUAL_EXCHANGE_RATES.SGD_TO_INR },
      { fromCurrency: 'USD', toCurrency: 'SGD', rate: ACTUAL_EXCHANGE_RATES.USD_TO_SGD },
      { fromCurrency: 'USD', toCurrency: 'INR', rate: ACTUAL_EXCHANGE_RATES.USD_TO_INR },
      { fromCurrency: 'INR', toCurrency: 'SGD', rate: ACTUAL_EXCHANGE_RATES.INR_TO_SGD },
      { fromCurrency: 'INR', toCurrency: 'USD', rate: ACTUAL_EXCHANGE_RATES.INR_TO_USD }
    ];
    
    for (const rateUpdate of rateUpdates) {
      await prisma.exchangeRate.create({
        data: {
          fromCurrency: rateUpdate.fromCurrency,
          toCurrency: rateUpdate.toCurrency,
          rate: rateUpdate.rate,
          source: 'IBKR_actual',
          isActive: true
        }
      });
    }
    
    console.log('✅ Exchange rates updated to match IBKR');
    console.log(`   USD/SGD: ${ACTUAL_EXCHANGE_RATES.USD_TO_SGD}`);
    console.log(`   SGD/USD: ${ACTUAL_EXCHANGE_RATES.SGD_TO_USD}`);
    
    // 3. Delete existing holdings only
    // 3. Delete existing holdings only
    console.log('🗑️ Removing existing holdings...');
    const deletedCount = await prisma.holdings.deleteMany({
      where: { userId: user.id }
    });
    console.log(`✅ Deleted ${deletedCount.count} existing holdings`);
    
    // 4. Insert actual holdings
    console.log('📊 Adding actual holdings...');
    
    let totalValue = 0;
    const categoryTotals = { Core: 0, Growth: 0, Hedge: 0, Liquidity: 0 };
    
    for (const holding of ACTUAL_HOLDINGS) {
      const createdHolding = await prisma.holdings.create({
        data: {
          userId: user.id,
          categoryId: categoryMap[holding.category],
          symbol: holding.symbol,
          name: holding.name,
          valueSGD: holding.valueSGD,
          valueINR: holding.valueINR,
          valueUSD: holding.valueUSD,
          entryCurrency: holding.entryCurrency,
          location: holding.location,
          quantity: holding.quantity,
          costBasis: holding.costBasis,
          updatedAt: new Date()
        }
      });
      
      totalValue += holding.valueSGD;
      categoryTotals[holding.category] += holding.valueSGD;
      
      console.log(`  ✅ ${holding.symbol} - S$${holding.valueSGD.toLocaleString()} (${holding.category})`);
    }
    
    // 5. Summary
    console.log('\n🎉 ACTUAL PORTFOLIO DATA LOADED SUCCESSFULLY!');
    console.log(`📈 Total Portfolio Value: S${totalValue.toLocaleString()}`);
    console.log(`📊 Holdings Count: ${ACTUAL_HOLDINGS.length}`);
    console.log(`💱 Exchange rates synchronized with IBKR (USD/SGD: ${ACTUAL_EXCHANGE_RATES.USD_TO_SGD})`);
    
    // 6. Category breakdown
    // 6. Category breakdown
    console.log('\n📊 Category Breakdown:');
    Object.entries(categoryTotals).forEach(([category, value]) => {
      const percentage = (value / totalValue * 100).toFixed(1);
      const holdingsCount = ACTUAL_HOLDINGS.filter(h => h.category === category).length;
      console.log(`  ${category}: S${value.toLocaleString()} (${percentage}%) - ${holdingsCount} holdings`);
    });
    
    // 7. Test the system
    console.log('\n🧪 Testing system with actual data...');
    const holdingsCount = await prisma.holdings.count();
    const portfolioValue = await prisma.holdings.aggregate({
      _sum: { valueSGD: true }
    });
    
    console.log(`✅ Verification: ${holdingsCount} holdings totaling S${portfolioValue._sum.valueSGD?.toLocaleString()}`);
    
    console.log('\n🎯 Ready to test with actual portfolio data!');
    console.log('🌐 Visit: http://localhost:3000');
    console.log('📱 Test API: curl http://localhost:3000/api/insights');
    console.log('💡 Your actual portfolio will now show personalized AI insights!');
    console.log('💱 Currency conversions now match your IBKR rates!');
    
  } catch (error) {
    console.error('❌ Error replacing holdings data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  replaceWithActualHoldings();
}

module.exports = { replaceWithActualHoldings, ACTUAL_HOLDINGS };