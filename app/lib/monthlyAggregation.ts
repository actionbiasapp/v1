import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MonthlyAggregationResult {
  year: number;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  avgPortfolioValue: number;
  endPortfolioValue: number;
  netWorth: number;
  marketGains: number;
  returnPercent: number;
}

export async function aggregateMonthlyToAnnual(userId: string, year: number): Promise<MonthlyAggregationResult | null> {
  try {
    // Get all monthly snapshots for the year
    const monthlyData = await prisma.monthlySnapshot.findMany({
      where: { userId, year },
      orderBy: { month: 'asc' }
    });
    
    if (monthlyData.length === 0) {
      return null;
    }
    
    // Calculate annual totals
    const totalIncome = monthlyData.reduce((sum, m) => sum + Number(m.income), 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + Number(m.expenses), 0);
    const totalSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
    
    // Portfolio calculations
    const avgPortfolioValue = monthlyData.reduce((sum, m) => sum + Number(m.portfolioValue), 0) / monthlyData.length;
    const endPortfolioValue = monthlyData[monthlyData.length - 1].portfolioValue;
    const startPortfolioValue = monthlyData[0].portfolioValue;
    
    // Net worth calculations
    const endNetWorth = Number(monthlyData[monthlyData.length - 1].netWorth);
    const startNetWorth = Number(monthlyData[0].netWorth);
    
    // Market gains = end net worth - start net worth - total savings
    const marketGains = endNetWorth - startNetWorth - totalSavings;
    
    // Return percentage based on average portfolio value
    const returnPercent = avgPortfolioValue > 0 ? (marketGains / avgPortfolioValue) * 100 : 0;
    
    return {
      year,
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalSavings,
      savingsRate,
      avgPortfolioValue,
      endPortfolioValue: Number(endPortfolioValue),
      netWorth: endNetWorth,
      marketGains,
      returnPercent
    };
    
  } catch (error) {
    console.error('Error aggregating monthly data:', error);
    return null;
  }
}

export async function updateYearlyDataFromMonthly(userId: string, year: number): Promise<boolean> {
  try {
    const aggregation = await aggregateMonthlyToAnnual(userId, year);
    
    if (!aggregation) {
      console.log(`No monthly data found for year ${year}`);
      return false;
    }
    
    // Update or create yearly data
    await prisma.yearlyData.upsert({
      where: { userId_year: { userId, year } },
      update: {
        income: aggregation.income,
        expenses: aggregation.expenses,
        savings: aggregation.savings,
        netWorth: aggregation.netWorth,
        marketGains: aggregation.marketGains,
        returnPercent: aggregation.returnPercent,
        notes: `Auto-generated from monthly snapshots`
      },
      create: {
        userId,
        year,
        income: aggregation.income,
        expenses: aggregation.expenses,
        savings: aggregation.savings,
        netWorth: aggregation.netWorth,
        marketGains: aggregation.marketGains,
        returnPercent: aggregation.returnPercent,
        notes: `Auto-generated from monthly snapshots`
      }
    });
    
    console.log(`Updated yearly data for ${year} from monthly snapshots`);
    return true;
    
  } catch (error) {
    console.error('Error updating yearly data:', error);
    return false;
  }
} 