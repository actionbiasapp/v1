// app/api/financial-profile/route.ts - Extended with allocation management
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userId = 'default-user';
    
    // Fetch all financial records efficiently + portfolio strategy
    const [user, incomeRecords, expenseRecords, savingsRecords, netWorthRecords, portfolioStrategy] = await Promise.all([
      prisma.user.findFirst({ where: { id: userId } }),
      prisma.incomeRecord.findMany({ 
        where: { userId }, 
        orderBy: { year: 'desc' }
      }),
      prisma.expenseRecord.findMany({ 
        where: { userId }, 
        orderBy: { year: 'desc' }
      }),
      prisma.savingsRecord.findMany({ 
        where: { userId }, 
        orderBy: { year: 'desc' }
      }),
      prisma.netWorthRecord.findMany({ 
        where: { userId }, 
        orderBy: { year: 'desc' }
      }),
      prisma.portfolioStrategy.findFirst({ 
        where: { userId, isActive: true }
      })
    ]);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Build unified yearlyData including current year
    const allYears = new Set([
      ...incomeRecords.map(r => r.year),
      ...expenseRecords.map(r => r.year),
      ...savingsRecords.map(r => r.year),
      ...netWorthRecords.map(r => r.year)
    ]);

    const yearlyData = Array.from(allYears).map(year => {
      const income = incomeRecords.find(r => r.year === year);
      const expense = expenseRecords.find(r => r.year === year);
      const savings = savingsRecords.find(r => r.year === year);
      const netWorth = netWorthRecords.find(r => r.year === year);
      
      const incomeAmount = income ? Number(income.totalIncome) : 0;
      const expenseAmount = expense ? Number(expense.totalExpenses) : 0;
      const savingsAmount = incomeAmount - expenseAmount;
      const srsContributions = savings ? Number(savings.srsContributions) : 0;
      const netWorthAmount = netWorth ? Number(netWorth.netWorth) : savingsAmount * 4;
      
      return {
        year,
        income: incomeAmount,
        expenses: expenseAmount,
        savings: savingsAmount,
        srsContributions,
        netWorth: netWorthAmount,
        rate: incomeAmount > 0 ? (savingsAmount / incomeAmount) * 100 : 0
      };
    }).sort((a, b) => b.year - a.year);

    // Return unified structure with allocation targets
    return NextResponse.json({ 
      success: true, 
      yearlyData,
      fiData: {
        goal: Number(user.fiGoal),
        targetYear: user.fiTargetYear
      },
      userProfile: {
        taxStatus: user.taxStatus,
        country: user.country,
        srsLimit: Number(user.srsLimit)
      },
      allocationTargets: portfolioStrategy ? {
        core: Number(portfolioStrategy.coreTarget),
        growth: Number(portfolioStrategy.growthTarget),
        hedge: Number(portfolioStrategy.hedgeTarget),
        liquidity: Number(portfolioStrategy.liquidityTarget),
        rebalanceThreshold: Number(portfolioStrategy.rebalanceThreshold)
      } : {
        core: 25,
        growth: 55,
        hedge: 10,
        liquidity: 10,
        rebalanceThreshold: 5
      }
    });
    
  } catch (error) {
    console.error('GET API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load financial profile' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { yearlyData, fiData, userProfile } = await request.json();
    const userId = 'default-user';
    
    console.log('📥 Saving financial profile:', { 
      yearsCount: yearlyData?.length, 
      fiData, 
      userProfile 
    });

    // STEP 1: Update user profile first
    if (fiData || userProfile) {
      const updateData: Record<string, unknown> = {};
      
      if (fiData?.goal) updateData.fiGoal = Number(fiData.goal);
      if (fiData?.targetYear) updateData.fiTargetYear = Number(fiData.targetYear);
      if (userProfile?.taxStatus) updateData.taxStatus = userProfile.taxStatus;
      if (userProfile?.country) updateData.country = userProfile.country;
      if (userProfile?.srsLimit) updateData.srsLimit = Number(userProfile.srsLimit);
      
      if (Object.keys(updateData).length > 0) {
        updateData.lastProfileUpdate = new Date();
        
        await prisma.user.update({
          where: { id: userId },
          data: updateData
        });
        console.log('✅ User profile updated');
      }
    }

    // STEP 2: HANDLE DELETIONS - Get existing years and delete missing ones
    if (yearlyData && Array.isArray(yearlyData)) {
      const incomingYears = new Set(yearlyData.map(y => y.year));
      
      // Get all existing years from database
      const [existingIncome, existingExpense, existingSavings, existingNetWorth] = await Promise.all([
        prisma.incomeRecord.findMany({ where: { userId }, select: { year: true } }),
        prisma.expenseRecord.findMany({ where: { userId }, select: { year: true } }),
        prisma.savingsRecord.findMany({ where: { userId }, select: { year: true } }),
        prisma.netWorthRecord.findMany({ where: { userId }, select: { year: true } })
      ]);
      
      const existingYears = new Set([
        ...existingIncome.map(r => r.year),
        ...existingExpense.map(r => r.year),
        ...existingSavings.map(r => r.year),
        ...existingNetWorth.map(r => r.year)
      ]);
      
      // Find years to delete (exist in DB but not in incoming data)
      const yearsToDelete = Array.from(existingYears).filter(year => !incomingYears.has(year));
      
      // Delete records for years not in incoming data
      if (yearsToDelete.length > 0) {
        console.log('🗑️ Deleting years:', yearsToDelete);
        
        await Promise.all([
          prisma.incomeRecord.deleteMany({ 
            where: { userId, year: { in: yearsToDelete } } 
          }),
          prisma.expenseRecord.deleteMany({ 
            where: { userId, year: { in: yearsToDelete } } 
          }),
          prisma.savingsRecord.deleteMany({ 
            where: { userId, year: { in: yearsToDelete } } 
          }),
          prisma.netWorthRecord.deleteMany({ 
            where: { userId, year: { in: yearsToDelete } } 
          })
        ]);
        
        console.log('✅ Deleted years:', yearsToDelete);
      }
    }

    // STEP 3: Process ALL years sequentially (upsert remaining/new years)
    if (yearlyData && Array.isArray(yearlyData)) {
      for (const yearData of yearlyData) {
        const { year, income, expenses, savings, srsContributions, netWorth } = yearData;
        
        if (!year || year < 2000 || year > 2030) {
          console.warn(`⚠️ Skipping invalid year: ${year}`);
          continue;
        }

        try {
          // Income record
          if (income !== undefined && income >= 0) {
            await prisma.incomeRecord.upsert({
              where: { userId_year: { userId, year } },
              update: { 
                totalIncome: Number(income),
                employmentIncome: Number(income)
              },
              create: { 
                userId, 
                year, 
                totalIncome: Number(income),
                employmentIncome: Number(income)
              }
            });
          }

          // Expense record
          if (expenses !== undefined && expenses >= 0) {
            const savingsRate = income > 0 ? ((Number(income) - Number(expenses)) / Number(income)) * 100 : 0;
            const savingsAmount = Number(income) - Number(expenses);
            
            await prisma.expenseRecord.upsert({
              where: { userId_year: { userId, year } },
              update: { 
                totalExpenses: Number(expenses),
                savingsRate,
                savingsAmount
              },
              create: { 
                userId, 
                year, 
                totalExpenses: Number(expenses),
                savingsRate,
                savingsAmount
              }
            });
          }
          
          // SRS contributions
          if (srsContributions !== undefined && srsContributions >= 0) {
            await prisma.savingsRecord.upsert({
              where: { userId_year: { userId, year } },
              update: { 
                srsContributions: Number(srsContributions),
                totalSavings: Number(savings) || (Number(income) - Number(expenses))
              },
              create: { 
                userId, 
                year, 
                srsContributions: Number(srsContributions),
                totalSavings: Number(savings) || (Number(income) - Number(expenses))
              }
            });
          }

          // Net worth record
          if (netWorth !== undefined && netWorth >= 0) {
            const existingNetWorth = await prisma.netWorthRecord.findFirst({
              where: { userId, year }
            });

            if (existingNetWorth) {
              await prisma.netWorthRecord.update({
                where: { id: existingNetWorth.id },
                data: { 
                  netWorth: Number(netWorth),
                  totalAssets: Number(netWorth),
                  totalLiabilities: 0
                }
              });
            } else {
              await prisma.netWorthRecord.create({
                data: { 
                  userId, 
                  year, 
                  netWorth: Number(netWorth),
                  totalAssets: Number(netWorth),
                  totalLiabilities: 0
                }
              });
            }
          }

          console.log(`✅ Processed year ${year} successfully`);
          
        } catch (yearError) {
          console.error(`❌ Error processing year ${year}:`, yearError);
          // Continue with other years instead of failing entire operation
        }
      }
    }

    console.log('🎉 Financial profile save completed successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Financial profile saved successfully',
      processedYears: yearlyData?.length || 0
    });
    
  } catch (error) {
    console.error('POST API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save financial profile' 
    }, { status: 500 });
  }
}

// NEW: PATCH handler for allocation updates
export async function PATCH(request: NextRequest) {
  try {
    const { allocationTargets } = await request.json();
    const userId = 'default-user';
    
    console.log('📊 Updating allocation targets:', allocationTargets);
    
    // Validate allocation targets
    const { core, growth, hedge, liquidity, rebalanceThreshold } = allocationTargets;
    const total = core + growth + hedge + liquidity;
    
    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json({ 
        success: false, 
        error: `Allocation must total 100%, got ${total}%` 
      }, { status: 400 });
    }
    
    // Validate individual values
    if (core < 0 || growth < 0 || hedge < 0 || liquidity < 0 || rebalanceThreshold < 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Allocation percentages must be positive' 
      }, { status: 400 });
    }
    
    // Deactivate existing strategy
    await prisma.portfolioStrategy.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });
    
    // Create new active strategy
    const newStrategy = await prisma.portfolioStrategy.create({
      data: {
        userId,
        strategyName: `Custom Strategy ${new Date().toISOString().split('T')[0]}`,
        coreTarget: core,
        growthTarget: growth,
        hedgeTarget: hedge,
        liquidityTarget: liquidity,
        rebalanceThreshold: rebalanceThreshold || 5,
        isActive: true
      }
    });
    
    console.log('✅ Allocation targets updated successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Allocation targets updated successfully',
      allocationTargets: {
        core: Number(newStrategy.coreTarget),
        growth: Number(newStrategy.growthTarget),
        hedge: Number(newStrategy.hedgeTarget),
        liquidity: Number(newStrategy.liquidityTarget),
        rebalanceThreshold: Number(newStrategy.rebalanceThreshold)
      }
    });
    
  } catch (error) {
    console.error('PATCH API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update allocation targets' 
    }, { status: 500 });
  }
}