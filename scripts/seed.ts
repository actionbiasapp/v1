import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a default user first
  const user = await prisma.user.upsert({
    where: { email: 'kunal@actionbias.com' },
    update: {},
    create: {
      email: 'kunal@actionbias.com',
      name: 'Kunal',
      country: 'Singapore',
      taxStatus: 'Employment Pass',
      srsLimit: 35700,
      fiGoal: 2500000,
      fiTargetYear: 2032,
    },
  });

  // Delete existing data first
  await prisma.holdings.deleteMany({ where: { userId: user.id } });
  await prisma.assetCategory.deleteMany({ where: { userId: user.id } });

  // Create asset categories with NEW allocation targets (80/20 approach)
  const categories = await Promise.all([
    prisma.assetCategory.create({
      data: {
        userId: user.id,
        name: 'Core',
        targetPercentage: 25,
        description: 'Diversified index funds (VUAA + Indian NIFTY)',
      },
    }),
    prisma.assetCategory.create({
      data: {
        userId: user.id,
        name: 'Growth',
        targetPercentage: 55,
        description: 'Individual stocks + ETH + growth assets',
      },
    }),
    prisma.assetCategory.create({
      data: {
        userId: user.id,
        name: 'Hedge',
        targetPercentage: 10,
        description: 'BTC, gold, bonds - store of value',
      },
    }),
    prisma.assetCategory.create({
      data: {
        userId: user.id,
        name: 'Liquidity',
        targetPercentage: 10,
        description: 'Cash and stablecoins',
      },
    }),
  ]);

  // Your actual holdings with UPDATED CLASSIFICATIONS
  const holdings = [
    // CORE: Diversified index funds
    { symbol: 'VUAA', name: 'Vanguard S&P 500 UCITS ETF', value: 52798, category: 'Core', location: 'IBKR' },
    { symbol: 'INDIA', name: 'Indian NIFTY 100 ETFs', value: 64000, category: 'Core', location: 'ICICI Direct' },
    
    // GROWTH: Individual stocks + ETH
    { symbol: 'NVDA', name: 'NVIDIA Corp', value: 19966, category: 'Growth', location: 'IBKR' },
    { symbol: 'GOOG', name: 'Google Class A', value: 18190, category: 'Growth', location: 'IBKR' },
    { symbol: 'TSLA', name: 'Tesla Inc', value: 15916, category: 'Growth', location: 'IBKR' },
    { symbol: 'IREN', name: 'Iris Energy', value: 3787, category: 'Growth', location: 'IBKR' },
    { symbol: 'HIMS', name: 'Hims & Hers Health', value: 6012, category: 'Growth', location: 'IBKR' },
    { symbol: 'UNH', name: 'UnitedHealth Group', value: 7949, category: 'Growth', location: 'IBKR' },
    { symbol: 'AAPL', name: 'Apple Inc', value: 8017, category: 'Growth', location: 'IBKR' },
    { symbol: 'AMZN', name: 'Amazon.com Inc', value: 5611, category: 'Growth', location: 'IBKR' },
    { symbol: 'CRM', name: 'Salesforce Inc', value: 6805, category: 'Growth', location: 'IBKR' },
    { symbol: 'ETH', name: 'Ethereum', value: 81459, category: 'Growth', location: 'CoinGecko' },
    
    // HEDGE: Store of value assets
    { symbol: 'BTC', name: 'Bitcoin', value: 58314, category: 'Hedge', location: 'CoinGecko' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', value: 16959, category: 'Hedge', location: 'CoinGecko' },
    { symbol: 'GOLD', name: 'Physical Gold', value: 14000, category: 'Hedge', location: 'Physical' },
    
    // LIQUIDITY: Cash and stablecoins
    { symbol: 'SGD', name: 'Singapore Dollars', value: 44000, category: 'Liquidity', location: 'Standard Chartered' },
    { symbol: 'SGD', name: 'Singapore Dollars', value: 30000, category: 'Liquidity', location: 'DBS Bank' },
    { symbol: 'USDC', name: 'USD Coin (Aave)', value: 30000, category: 'Liquidity', location: 'Aave' },
    { symbol: 'USDC', name: 'USD Coin', value: 3027, category: 'Liquidity', location: 'Binance' },
  ];

  // Insert holdings
  for (const holding of holdings) {
    const categoryRecord = categories.find(c => c.name === holding.category);
    
    await prisma.holdings.create({
      data: {
        userId: user.id,
        categoryId: categoryRecord!.id,
        symbol: holding.symbol,
        name: holding.name,
        currentValue: holding.value,
        location: holding.location,
        currency: 'SGD',
      },
    });
  }

  console.log('Database seeded with updated portfolio!');
  console.log(`Total portfolio value: $${holdings.reduce((sum, h) => sum + h.value, 0).toLocaleString()} SGD`);
  console.log('New allocation targets:');
  console.log('- Core: 25% (VUAA + Indian NIFTY)');
  console.log('- Growth: 55% (Stocks + ETH)');
  console.log('- Hedge: 10% (BTC + Gold)');
  console.log('- Liquidity: 10% (Cash + Stables)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });