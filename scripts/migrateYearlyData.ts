import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Find dev user
  const user = await prisma.user.findFirst({ where: { email: 'dev@local.test' } });
  if (!user) {
    throw new Error('Dev user not found. Run the holdings import first.');
  }

  // 2. Gather all years from old tables
  const incomeYears = (await prisma.incomeRecord.findMany({ where: { userId: user.id } })).map(r => r.year);
  const expenseYears = (await prisma.expenseRecord.findMany({ where: { userId: user.id } })).map(r => r.year);
  const savingsYears = (await prisma.savingsRecord.findMany({ where: { userId: user.id } })).map(r => r.year);
  const netWorthYears = (await prisma.netWorthRecord.findMany({ where: { userId: user.id } })).map(r => r.year);
  const allYears = Array.from(new Set([...incomeYears, ...expenseYears, ...savingsYears, ...netWorthYears])).sort();

  let count = 0;
  for (const year of allYears) {
    // 3. Gather data for this year
    const income = await prisma.incomeRecord.findFirst({ where: { userId: user.id, year } });
    const expense = await prisma.expenseRecord.findFirst({ where: { userId: user.id, year } });
    const savings = await prisma.savingsRecord.findFirst({ where: { userId: user.id, year } });
    const netWorth = await prisma.netWorthRecord.findFirst({ where: { userId: user.id, year } });

    // 4. Upsert into YearlyData
    await prisma.yearlyData.upsert({
      where: { userId_year: { userId: user.id, year } },
      update: {
        netWorth: netWorth?.netWorth ?? 0,
        income: income?.totalIncome ?? 0,
        expenses: expense?.totalExpenses ?? 0,
        savings: savings?.totalSavings ?? 0,
        srs: savings?.srsContributions ?? 0,
        marketGains: 0, // Add logic if you have this field elsewhere
        returnPercent: 0, // Add logic if you have this field elsewhere
        notes: [income?.notes, expense?.notes, savings?.notes, netWorth?.notes].filter(Boolean).join(' | ') || null,
        isEstimated: income?.isEstimated || expense?.isEstimated || savings?.isEstimated || netWorth?.isEstimated || false,
        confidence: income?.confidence || expense?.confidence || savings?.confidence || netWorth?.confidence || 'medium',
      },
      create: {
        userId: user.id,
        year,
        netWorth: netWorth?.netWorth ?? 0,
        income: income?.totalIncome ?? 0,
        expenses: expense?.totalExpenses ?? 0,
        savings: savings?.totalSavings ?? 0,
        srs: savings?.srsContributions ?? 0,
        marketGains: 0,
        returnPercent: 0,
        notes: [income?.notes, expense?.notes, savings?.notes, netWorth?.notes].filter(Boolean).join(' | ') || null,
        isEstimated: income?.isEstimated || expense?.isEstimated || savings?.isEstimated || netWorth?.isEstimated || false,
        confidence: income?.confidence || expense?.confidence || savings?.confidence || netWorth?.confidence || 'medium',
      },
    });
    count++;
  }
  console.log(`Migrated yearly data for ${count} years to YearlyData table.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 