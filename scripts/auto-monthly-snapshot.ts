import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEV_EMAIL = 'dev@local.test';

export async function createMonthlySnapshot() {
  try {
    // Get dev user
    const user = await prisma.user.findFirst({ where: { email: DEV_EMAIL } });
    if (!user) {
      console.log('Dev user not found');
      return;
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    // Check if snapshot already exists for current month
    const existing = await prisma.monthlySnapshot.findUnique({
      where: { userId_year_month: { userId: user.id, year, month } }
    });
    
    if (existing) {
      console.log(`Snapshot for ${year}-${month} already exists`);
      return;
    }
    
    // Get current portfolio value from holdings
    const holdings = await prisma.holdings.findMany({ 
      where: { userId: user.id } 
    });
    
    const portfolioValue = holdings.reduce((sum, h) => sum + Number(h.valueSGD), 0);
    
    // Create snapshot with auto-populated portfolio value
    const snapshot = await prisma.monthlySnapshot.create({
      data: {
        userId: user.id,
        year,
        month,
        income: 0, // User can update
        expenses: 0, // User can update
        portfolioValue,
        netWorth: portfolioValue, // Simplified for now
        notes: 'Auto-generated snapshot'
      }
    });
    
    console.log(`Created monthly snapshot for ${year}-${month} with portfolio value: ${portfolioValue}`);
    return snapshot;
    
  } catch (error) {
    console.error('Error creating monthly snapshot:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createMonthlySnapshot();
} 