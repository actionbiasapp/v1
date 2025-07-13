// scripts/populate-singapore-portfolio.js
// Realistic Singapore Employment Pass holder portfolio data ($487k total)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Singapore Employment Pass holder portfolio - realistic allocation
const SINGAPORE_EXPAT_PORTFOLIO = {
  totalValue: 487000, // SGD
  targetAllocation: {
    Core: 25,      // $121,750 - Stable foundation
    Growth: 55,    // $267,850 - Growth-focused
    Hedge: 10,     // $48,700 - Protection/Alternative
    Liquidity: 10  // $48,700 - Cash/Liquid
  },
  
  holdings: [
    // CORE CATEGORY (25% = $121,750)
    {
      symbol: 'VUAA.L',
      name: 'Vanguard S&P 500 UCITS ETF',
      valueSGD: 45000,
      valueUSD: 33300,
      valueINR: 2835000,
      entryCurrency: 'SGD',
      category: 'Core',
      location: 'IBKR',
      quantity: 1250,
      costBasis: 42000
    },
    {
      symbol: 'IWDA.L',
      name: 'iShares Core MSCI World UCITS ETF',
      valueSGD: 38000,
      valueUSD: 28120,
      valueINR: 2394000,
      entryCurrency: 'SGD',
      category: 'Core',
      location: 'IBKR',
      quantity: 800,
      costBasis: 35000
    },
    {
      symbol: 'ES3.SI',
      name: 'SPDR STI ETF',
      valueSGD: 25000,
      valueUSD: 18500,
      valueINR: 1575000,
      entryCurrency: 'SGD',
      category: 'Core',
      location: 'DBS Bank',
      quantity: 8500,
      costBasis: 24000
    },
    {
      symbol: 'G3B.SI',
      name: 'Lion-OCBC Sec HSCI ETF',
      valueSGD: 13750,
      valueUSD: 10175,
      valueINR: 866250,
      entryCurrency: 'SGD',
      category: 'Core',
      location: 'Standard Chartered',
      quantity: 1100,
      costBasis: 12000
    },
    
    // GROWTH CATEGORY (55% = $267,850)
    {
      symbol: 'TSLA',
      name: 'Tesla Inc',
      valueSGD: 65000,
      valueUSD: 48100,
      valueINR: 4095000,
      entryCurrency: 'USD',
      category: 'Growth',
      location: 'IBKR',
      quantity: 180,
      costBasis: 58000
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      valueSGD: 55000,
      valueUSD: 40700,
      valueINR: 3465000,
      entryCurrency: 'USD',
      category: 'Growth',
      location: 'IBKR',
      quantity: 45,
      costBasis: 35000
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      valueSGD: 42000,
      valueUSD: 31080,
      valueINR: 2646000,
      entryCurrency: 'USD',
      category: 'Growth',
      location: 'IBKR',
      quantity: 85,
      costBasis: 38000
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc Class A',
      valueSGD: 35000,
      valueUSD: 25900,
      valueINR: 2205000,
      entryCurrency: 'USD',
      category: 'Growth',
      location: 'IBKR',
      quantity: 250,
      costBasis: 32000
    },
    {
      symbol: 'RELIANCE.NS',
      name: 'Reliance Industries Limited',
      valueSGD: 28000,
      valueUSD: 20720,
      valueINR: 1764000,
      entryCurrency: 'INR',
      category: 'Growth',
      location: 'ICICI Direct',
      quantity: 600,
      costBasis: 25000
    },
    {
      symbol: 'TCS.NS',
      name: 'Tata Consultancy Services',
      valueSGD: 22000,
      valueUSD: 16280,
      valueINR: 1386000,
      entryCurrency: 'INR',
      category: 'Growth',
      location: 'ICICI Direct',
      quantity: 350,
      costBasis: 20000
    },
    {
      symbol: 'HDFC.NS',
      name: 'HDFC Bank Limited',
      valueSGD: 20850,
      valueUSD: 15429,
      valueINR: 1313550,
      entryCurrency: 'INR',
      category: 'Growth',
      location: 'ICICI Direct',
      quantity: 900,
      costBasis: 18000
    },
    
    // HEDGE CATEGORY (10% = $48,700)
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      valueSGD: 28000,
      valueUSD: 20720,
      valueINR: 1764000,
      entryCurrency: 'USD',
      category: 'Hedge',
      location: 'CoinGecko',
      quantity: 0.35,
      costBasis: 24000
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      valueSGD: 15000,
      valueUSD: 11100,
      valueINR: 945000,
      entryCurrency: 'USD',
      category: 'Hedge',
      location: 'CoinGecko',
      quantity: 4.2,
      costBasis: 12000
    },
    {
      symbol: 'PAXG',
      name: 'PAX Gold',
      valueSGD: 5700,
      valueUSD: 4218,
      valueINR: 359100,
      entryCurrency: 'USD',
      category: 'Hedge',
      location: 'CoinGecko',
      quantity: 2.1,
      costBasis: 5000
    },
    
    // LIQUIDITY CATEGORY (10% = $48,700)
    {
      symbol: 'SGD',
      name: 'Singapore Dollar Cash',
      valueSGD: 25000,
      valueUSD: 18500,
      valueINR: 1575000,
      entryCurrency: 'SGD',
      category: 'Liquidity',
      location: 'DBS Bank',
      quantity: 25000,
      costBasis: 25000
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      valueSGD: 15000,
      valueUSD: 11100,
      valueINR: 945000,
      entryCurrency: 'USD',
      category: 'Liquidity',
      location: 'CoinGecko',
      quantity: 11100,
      costBasis: 15000
    },
    {
      symbol: 'CASH.INR',
      name: 'Indian Rupee Cash',
      valueSGD: 8700,
      valueUSD: 6438,
      valueINR: 548100,
      entryCurrency: 'INR',
      category: 'Liquidity',
      location: 'ICICI Bank',
      quantity: 548100,
      costBasis: 8700
    }
  ]
};

// Exchange rates (realistic as of July 2025)
const EXCHANGE_RATES = {
  SGD_TO_USD: 0.74,
  SGD_TO_INR: 63.0,
  USD_TO_SGD: 1.35,
  USD_TO_INR: 85.0,
  INR_TO_SGD: 0.0159,
  INR_TO_USD: 0.0118
};

async function populatePortfolioData() {
  try {
    console.log('🚀 Starting Singapore Employment Pass holder portfolio population...');
    
    // 1. Clear existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.holdings.deleteMany({});
    await prisma.assetCategory.deleteMany({});
    await prisma.exchangeRate.deleteMany({});
    await prisma.user.deleteMany({});
    
    // 2. Create default user (Employment Pass holder)
    console.log('👤 Creating Employment Pass holder user...');
    const user = await prisma.user.create({
      data: {
        id: 'default-user',
        email: 'expat@singapore.com',
        name: 'Employment Pass Holder',
        country: 'Singapore',
        taxStatus: 'Employment Pass',
        srsLimit: 35700,
        fiGoal: 2500000,
        fiTargetYear: 2032
      }
    });
    
    // 3. Create asset categories
    console.log('📊 Creating asset categories...');
    const categories = await Promise.all([
      prisma.assetCategory.create({
        data: {
          id: 'core-category',
          userId: user.id,
          name: 'Core',
          targetPercentage: 25,
          description: 'Stable foundation through broad market exposure'
        }
      }),
      prisma.assetCategory.create({
        data: {
          id: 'growth-category',
          userId: user.id,
          name: 'Growth',
          targetPercentage: 55,
          description: 'Wealth building through concentrated positions'
        }
      }),
      prisma.assetCategory.create({
        data: {
          id: 'hedge-category',
          userId: user.id,
          name: 'Hedge',
          targetPercentage: 10,
          description: 'Portfolio protection and inflation hedge'
        }
      }),
      prisma.assetCategory.create({
        data: {
          id: 'liquidity-category',
          userId: user.id,
          name: 'Liquidity',
          targetPercentage: 10,
          description: 'Opportunity fund and emergency buffer'
        }
      })
    ]);
    
    const categoryMap = {
      'Core': categories[0].id,
      'Growth': categories[1].id,
      'Hedge': categories[2].id,
      'Liquidity': categories[3].id
    };
    
    // 4. Populate exchange rates
    console.log('💱 Setting up exchange rates...');
    await Promise.all([
      prisma.exchangeRate.create({
        data: {
          fromCurrency: 'SGD',
          toCurrency: 'USD',
          rate: EXCHANGE_RATES.SGD_TO_USD,
          source: 'api',
          isActive: true
        }
      }),
      prisma.exchangeRate.create({
        data: {
          fromCurrency: 'SGD',
          toCurrency: 'INR',
          rate: EXCHANGE_RATES.SGD_TO_INR,
          source: 'api',
          isActive: true
        }
      }),
      prisma.exchangeRate.create({
        data: {
          fromCurrency: 'USD',
          toCurrency: 'SGD',
          rate: EXCHANGE_RATES.USD_TO_SGD,
          source: 'api',
          isActive: true
        }
      }),
      prisma.exchangeRate.create({
        data: {
          fromCurrency: 'USD',
          toCurrency: 'INR',
          rate: EXCHANGE_RATES.USD_TO_INR,
          source: 'api',
          isActive: true
        }
      }),
      prisma.exchangeRate.create({
        data: {
          fromCurrency: 'INR',
          toCurrency: 'SGD',
          rate: EXCHANGE_RATES.INR_TO_SGD,
          source: 'api',
          isActive: true
        }
      }),
      prisma.exchangeRate.create({
        data: {
          fromCurrency: 'INR',
          toCurrency: 'USD',
          rate: EXCHANGE_RATES.INR_TO_USD,
          source: 'api',
          isActive: true
        }
      })
    ]);
    
    // 5. Create holdings
    console.log('🏦 Creating 19 realistic holdings...');
    let totalValue = 0;
    
    for (const holding of SINGAPORE_EXPAT_PORTFOLIO.holdings) {
      await prisma.holdings.create({
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
      console.log(`  ✅ ${holding.symbol} - S$${holding.valueSGD.toLocaleString()} (${holding.category})`);
    }
    
    // 6. Summary
    console.log('\n🎉 SINGAPORE EXPAT PORTFOLIO POPULATED SUCCESSFULLY!');
    console.log(`📈 Total Portfolio Value: S$${totalValue.toLocaleString()}`);
    console.log(`🏢 Employment Pass Holder Profile: ${user.name}`);
    console.log(`📊 Holdings Count: ${SINGAPORE_EXPAT_PORTFOLIO.holdings.length}`);
    console.log(`🎯 Target Allocation: Core ${SINGAPORE_EXPAT_PORTFOLIO.targetAllocation.Core}%, Growth ${SINGAPORE_EXPAT_PORTFOLIO.targetAllocation.Growth}%, Hedge ${SINGAPORE_EXPAT_PORTFOLIO.targetAllocation.Hedge}%, Liquidity ${SINGAPORE_EXPAT_PORTFOLIO.targetAllocation.Liquidity}%`);
    console.log(`💰 SRS Limit: S$${user.srsLimit.toLocaleString()} (Employment Pass advantage)`);
    console.log(`🚀 FI Goal: S$${user.fiGoal.toLocaleString()} by ${user.fiTargetYear}`);
    
    // 7. Test the system
    console.log('\n🧪 Testing populated system...');
    const holdingsCount = await prisma.holdings.count();
    const portfolioValue = await prisma.holdings.aggregate({
      _sum: { valueSGD: true }
    });
    
    console.log(`✅ Verification: ${holdingsCount} holdings totaling S$${portfolioValue._sum.valueSGD?.toLocaleString()}`);
    
    // 8. Category breakdown
    console.log('\n📊 Category Breakdown:');
    const categoryBreakdown = await prisma.holdings.groupBy({
      by: ['categoryId'],
      _sum: { valueSGD: true },
      _count: { id: true }
    });
    
    for (const category of categoryBreakdown) {
      const categoryName = categories.find(c => c.id === category.categoryId)?.name;
      const value = category._sum.valueSGD || 0;
      const percentage = (value / totalValue * 100).toFixed(1);
      console.log(`  ${categoryName}: S$${value.toLocaleString()} (${percentage}%) - ${category._count.id} holdings`);
    }
    
    console.log('\n🎯 Ready for Action Bias intelligence insights!');
    console.log('🌐 Visit: http://localhost:3000');
    console.log('📱 Test API: curl http://localhost:3000/api/insights');
    
  } catch (error) {
    console.error('❌ Error populating portfolio data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  populatePortfolioData();
}

module.exports = { populatePortfolioData, SINGAPORE_EXPAT_PORTFOLIO, EXCHANGE_RATES };