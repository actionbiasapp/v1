import { PrismaClient } from '@prisma/client';
import { aggregateMonthlyToAnnual, updateYearlyDataFromMonthly } from '../app/lib/monthlyAggregation';

const prisma = new PrismaClient();
const DEV_EMAIL = 'dev@local.test';

async function testMonthlyAggregation() {
  try {
    // Get dev user
    const user = await prisma.user.findFirst({ where: { email: DEV_EMAIL } });
    if (!user) {
      console.log('Dev user not found');
      return;
    }

    console.log('Testing monthly aggregation for 2025...');
    
    // Test aggregation
    const aggregation = await aggregateMonthlyToAnnual(user.id, 2025);
    
    if (aggregation) {
      console.log('✅ Monthly aggregation successful:');
      console.log(`   Year: ${aggregation.year}`);
      console.log(`   Total Income: $${aggregation.income.toLocaleString()}`);
      console.log(`   Total Expenses: $${aggregation.expenses.toLocaleString()}`);
      console.log(`   Total Savings: $${aggregation.savings.toLocaleString()}`);
      console.log(`   Savings Rate: ${aggregation.savingsRate.toFixed(1)}%`);
      console.log(`   Average Portfolio: $${aggregation.avgPortfolioValue.toLocaleString()}`);
      console.log(`   End Portfolio: $${aggregation.endPortfolioValue.toLocaleString()}`);
      console.log(`   Net Worth: $${aggregation.netWorth.toLocaleString()}`);
      console.log(`   Market Gains: $${aggregation.marketGains.toLocaleString()}`);
      console.log(`   Return %: ${aggregation.returnPercent.toFixed(2)}%`);
      
      // Test updating yearly data
      console.log('\n🔄 Updating yearly data from monthly snapshots...');
      const updated = await updateYearlyDataFromMonthly(user.id, 2025);
      
      if (updated) {
        console.log('✅ Yearly data updated successfully!');
      } else {
        console.log('❌ Failed to update yearly data');
      }
    } else {
      console.log('❌ No monthly data found for 2025');
    }
    
  } catch (error) {
    console.error('Error testing monthly aggregation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  testMonthlyAggregation();
} 