// app/api/financial-profile/route.ts - Extended with allocation management
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEV_EMAIL = 'dev@local.test';

// TODO: Replace with real user lookup/auth
async function getCurrentUser() {
  return prisma.user.findFirst({ where: { email: DEV_EMAIL } });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  // Map to frontend profile fields using only User model fields
  const profile = {
    // annualIncome: user.annualIncome || 0, // Not in model
    incomeCurrency: user.primaryCurrency || 'SGD',
    taxStatus: user.taxStatus || 'Employment Pass',
    country: user.country || 'Singapore',
    srsLimit: user.srsLimit?.toNumber?.() ?? 35700,
    fiGoal: user.fiGoal?.toNumber?.() ?? 2500000,
    fiTargetYear: user.fiTargetYear || 2032,
    profileCompleteness: user.profileCompleteness || 0,
    coreTarget: user.coreTarget || 25,
    growthTarget: user.growthTarget || 55,
    hedgeTarget: user.hedgeTarget || 10,
    liquidityTarget: user.liquidityTarget || 10,
    rebalanceThreshold: user.rebalanceThreshold || 5
  };

  // Get yearly data
  const yearlyData = await prisma.yearlyData.findMany({
    where: { userId: user.id },
    orderBy: { year: 'asc' }
  });

  return NextResponse.json({ success: true, profile, yearlyData });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const body = await request.json();
  const { profile, yearlyData } = body;

  try {
    // Step 1: Update the user's main profile data
    if (profile) {
        await prisma.user.update({
        where: { id: user.id },
        data: {
          primaryCurrency: profile.incomeCurrency,
          taxStatus: profile.taxStatus,
          country: profile.country,
          srsLimit: profile.srsLimit,
          fiGoal: profile.fiGoal,
          fiTargetYear: profile.fiTargetYear,
          profileCompleteness: profile.profileCompleteness,
          coreTarget: profile.core,
          growthTarget: profile.growth,
          hedgeTarget: profile.hedge,
          liquidityTarget: profile.liquidity,
          rebalanceThreshold: profile.rebalanceThreshold
        }
      });
    }

    // Step 2: Handle deletions for yearlyData
    if (Array.isArray(yearlyData)) {
      const incomingYears = new Set(yearlyData.map(y => y.year));
      const existingRecords = await prisma.yearlyData.findMany({
        where: { userId: user.id },
        select: { year: true }
      });
      const existingYears = new Set(existingRecords.map(r => r.year));
      
      const yearsToDelete = [...existingYears].filter(year => !incomingYears.has(year));
      
      if (yearsToDelete.length > 0) {
        await prisma.yearlyData.deleteMany({
          where: {
            userId: user.id,
            year: { in: yearsToDelete }
              }
            });
          }
          
      // Step 3: Upsert (update or insert) the remaining yearly data
      for (const yd of yearlyData) {
        await prisma.yearlyData.upsert({
          where: { userId_year: { userId: user.id, year: yd.year } },
              update: { 
            netWorth: yd.netWorth ?? 0,
            income: yd.income ?? 0,
            expenses: yd.expenses ?? 0,
            savings: yd.savings ?? 0,
            srs: yd.srsContributions ?? 0, // Match frontend srsContributions
            marketGains: yd.marketGains ?? 0,
            returnPercent: yd.returnPercent ?? 0,
            notes: yd.notes || null
              },
              create: { 
            userId: user.id,
            year: yd.year,
            netWorth: yd.netWorth ?? 0,
            income: yd.income ?? 0,
            expenses: yd.expenses ?? 0,
            savings: yd.savings ?? 0,
            srs: yd.srsContributions ?? 0, // Match frontend srsContributions
            marketGains: yd.marketGains ?? 0,
            returnPercent: yd.returnPercent ?? 0,
            notes: yd.notes || null
          }
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

// NEW: PATCH handler for allocation updates
export async function PATCH(request: NextRequest) {
  try {
    const { allocationTargets } = await request.json();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    const userId = user.id;
    

    
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