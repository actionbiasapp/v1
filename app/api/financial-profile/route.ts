// app/api/financial-profile/route.ts - BUILD ERROR FIXED
// Phase 1+2: Unified processing + deletion logic + build fixes
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userId = 'default-user';
    
    // Fetch all financial records efficiently
    const [user, incomeRecords, expenseRecords, savingsRecords, netWorthRecords] = await Promise.all([
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

    // Return unified structure - no separate current year data
    return NextResponse.json({ 
      success: true, 
      yearlyData, // ALL years including current
      fiData: {
        goal: Number(user.fiGoal),
        targetYear: user.fiTargetYear
      },
      userProfile: {
        taxStatus: user.taxStatus,
        country: user.country,
        srsLimit: Number(user.srsLimit)
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
      const updateData: Record<string, unknown> = {}; // Fixed: no more 'any' type
      
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

          // Net worth record - FIXED: Use individual where clause
          if (netWorth !== undefined && netWorth >= 0) {
            // Check if record exists first
            const existingNetWorth = await prisma.netWorthRecord.findFirst({
              where: { userId, year }
            });

            if (existingNetWorth) {
              // Update existing record
              await prisma.netWorthRecord.update({
                where: { id: existingNetWorth.id },
                data: { 
                  netWorth: Number(netWorth),
                  totalAssets: Number(netWorth),
                  totalLiabilities: 0
                }
              });
            } else {
              // Create new record
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