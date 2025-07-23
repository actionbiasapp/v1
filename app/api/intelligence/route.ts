import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { type Holding, type CategoryData } from '@/app/lib/types/shared';
import { 
  generateTaxIntelligence, 
  convertTaxIntelligenceToActions, 
  estimateIncomeFromPortfolio 
} from '@/app/lib/singaporeTax';

const prisma = new PrismaClient();
const rateLimits = new Map<string, { count: number; resetTime: number }>();

// NEW: Extracted category processing logic from hook for use in API
function processCategoriesForIntelligence(
  holdings: Holding[],
  totalValue: number,
  displayCurrency: 'SGD' | 'USD' | 'INR' = 'SGD',
  customTargets?: {
    core: number;
    growth: number;
    hedge: number;
    liquidity: number;
    rebalanceThreshold: number;
  }
): CategoryData[] {
  // Use custom targets if provided, otherwise use defaults
  const targets = customTargets || {
    core: 25,
    growth: 55,
    hedge: 10,
    liquidity: 10,
    rebalanceThreshold: 5
  };

  // Category definitions with custom targets
  const categories = [
    {
      name: 'Core',
      target: targets.core,
      color: 'bg-blue-500',
      icon: '🛡️',
      description: 'Stable dividend stocks, bonds, REITs'
    },
    {
      name: 'Growth',
      target: targets.growth,
      color: 'bg-green-500',
      icon: '📈',
      description: 'Growth stocks, tech, emerging markets'
    },
    {
      name: 'Hedge',
      target: targets.hedge,
      color: 'bg-yellow-500',
      icon: '⚖️',
      description: 'Gold, commodities, hedge funds'
    },
    {
      name: 'Liquidity',
      target: targets.liquidity,
      color: 'bg-purple-500',
      icon: '💰',
      description: 'Cash, money market, short-term bonds'
    }
  ];

  // Process each category
  return categories.map(category => {
    const categoryHoldings = holdings.filter(h => h.category === category.name);
    
    // Calculate current value in display currency
    const currentValue = categoryHoldings.reduce((sum, holding) => {
      const currencyValue = displayCurrency === 'SGD' ? holding.valueSGD :
                           displayCurrency === 'USD' ? holding.valueUSD :
                           holding.valueINR;
      return sum + currencyValue;
    }, 0);

    const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    
    // Gap-based calculations (keep for compatibility)
    const gap = currentPercent - category.target;
    const gapAmount = (gap / 100) * totalValue;

    // NEW: Completion-based calculations
    const completionPercent = category.target > 0 ? (currentPercent / category.target) * 100 : 0;

    // Determine status using custom rebalance threshold
    const threshold = targets.rebalanceThreshold;
    let status: 'perfect' | 'underweight' | 'excess';
    let statusText: string;
    let callout: string;

    // FIXED - Use completion percentage for both status AND callouts
    if (completionPercent >= 95 && completionPercent <= 105) {
        status = 'perfect';
        statusText = 'Perfect';
        callout = '✅ Perfect allocation - target achieved';
      } else if (completionPercent < 95) {
        status = 'underweight';
        const shortfall = 100 - completionPercent;
        statusText = shortfall > 0 ? `${Math.round(shortfall)}% to go` : 'Perfect';
        
        if (shortfall > 20) {
          callout = `⚠️ ${Math.round(shortfall)}% short of target. Consider adding ${(Math.abs(gapAmount)/1000).toFixed(0)}k to reach your ${category.target}% allocation goal.`;
        } else if (shortfall > 5) {
          callout = `🎯 ${Math.round(shortfall)}% to go. Consider small additions to reach target.`;
        } else {
          callout = `🎯 Almost there! Just ${Math.round(shortfall)}% to go.`;
        }
      } else {
        status = 'excess';
        const overAmount = completionPercent - 100;
        statusText = `${Math.round(overAmount)}% over`;
        
        if (category.name === 'Liquidity' && completionPercent > 200) {
          callout = `🚨 Significantly over-allocated. Consider deploying ${(Math.abs(gapAmount)/1000).toFixed(0)}k excess to other categories.`;
        } else {
          callout = `⚖️ ${Math.round(overAmount)}% over target. Consider rebalancing.`;
        }
    }
    
    return {
      ...category,
      holdings: categoryHoldings,
      currentValue,
      currentPercent,
      completionPercent,
      gap,
      gapAmount,
      status,
      statusText,
      callout
    };
  });
}

// NEW: Simple fallback function
function getFallbackIntelligence(holdings: Holding[]) {
  const totalValue = holdings.reduce((sum, h) => sum + h.valueSGD, 0);
  
  return {
    statusIntelligence: {
      fiProgress: `${((totalValue / 1000000) * 100).toFixed(1)}% to first million`,
      urgentAction: "Portfolio analysis in progress",
      deadline: null,
      netWorth: totalValue
    },
    allocationIntelligence: [],
    actionIntelligence: [{
      id: 'fallback',
      type: 'opportunity',
      title: 'Review Portfolio Allocation',
      problem: 'Ensure your portfolio matches your target allocation',
      solution: 'Review and adjust allocations',
      benefit: 'Optimize portfolio performance',
      timeline: 'This week',
      actionText: 'Review Allocation',
      priority: 5,
      isClickable: true
    }],
    generated: new Date().toISOString(),
    nextRefresh: new Date(Date.now() + 300000).toISOString() // 5 minutes
  };
}

export async function GET() {
  try {
    // Get user ID dynamically from first holding
    const firstHolding = await prisma.holdings.findFirst({
      select: { userId: true }
    });
    
    if (!firstHolding) {
      return NextResponse.json({
        error: 'No holdings found in database',
        fallback: getFallbackIntelligence([])
      });
    }
    
    const userId = firstHolding.userId;

    
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          fallback: true
        },
        { status: 429 }
      );
    }
    
    const [user, holdings] = await Promise.all([
      prisma.user.findFirst({ where: { id: userId } }),
      prisma.holdings.findMany({
        where: { userId },
        include: { category: true }
      })
    ]);
    

    
    if (!holdings || holdings.length === 0) {
      return NextResponse.json({
        error: `No holdings found for user ${userId}`,
        fallback: getFallbackIntelligence([]),
        debug: { userId, userExists: !!user }
      });
    }
    
    const formattedHoldings: Holding[] = holdings.map(holding => ({
      id: holding.id,
      symbol: holding.symbol,
      name: holding.name,
      valueSGD: Number(holding.valueSGD),
      valueINR: Number(holding.valueINR),
      valueUSD: Number(holding.valueUSD),
      entryCurrency: holding.entryCurrency,
      category: holding.category.name,
      location: holding.location,
      quantity: holding.quantity ? Number(holding.quantity) : undefined,
      costBasis: holding.costBasis ? Number(holding.costBasis) : undefined
    }));

    // Calculate total portfolio value
    const totalValue = formattedHoldings.reduce((sum, holding) => sum + holding.valueSGD, 0);
    
    // Smart income estimation with conservative default
    const estimatedIncome = 120000; // Conservative default until user inputs real income
    
    // NEW (FIXED) - Load user's actual allocation targets
    // Try to get user's custom targets from financial profile API
    let userTargets;
    try {
      const profileResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/financial-profile`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.allocationTargets) {
          userTargets = profileData.allocationTargets;
        }
      }
    } catch (error) {
  
    }

    // Fallback to defaults if no custom targets found
    const finalTargets = userTargets || {
      core: 25,
      growth: 55,
      hedge: 10,
      liquidity: 10,
      rebalanceThreshold: 5
    };

    const categoryData = processCategoriesForIntelligence(
      formattedHoldings,
      totalValue,
      'SGD',
      finalTargets // Use actual user targets
    );
    
    // CONSOLIDATED: Tax intelligence generation (now from singaporeTax.ts)
    const taxIntelligence = generateTaxIntelligence(
      estimatedIncome, 
      0, // TODO: Get actual SRS contributions from user profile
      'Employment Pass'
    );
    
    // CONSOLIDATED: Convert tax intelligence to action items (now from singaporeTax.ts)
    const taxActions = convertTaxIntelligenceToActions(taxIntelligence);
    
    // Generate portfolio-based action items
    const portfolioActions = categoryData
      .filter(cat => cat.status !== 'perfect' && Math.abs(cat.gapAmount) > 5000)
      .map((cat, index) => ({
        id: `${cat.name.toLowerCase()}-${cat.status}`,
        type: cat.status === 'excess' ? 'urgent' as const : 'opportunity' as const,
        title: cat.status === 'excess' ? `Reduce ${cat.name} Allocation` : `Increase ${cat.name} Allocation`,
        problem: cat.callout,
        solution: cat.status === 'excess' ? 
          `Consider moving ${(Math.abs(cat.gapAmount)/1000).toFixed(0)}k to underweight categories` :
          `Add ${(Math.abs(cat.gapAmount)/1000).toFixed(0)}k to ${cat.name} allocation`,
        benefit: 'Optimize portfolio balance and risk profile',
        timeline: 'Next rebalancing',
        actionText: cat.status === 'excess' ? 'Rebalance' : `Add to ${cat.name}`,
        priority: Math.abs(cat.gap) > 10 ? 9 : 7,
        isClickable: true
      }));
    
    // ENHANCED: Merge tax actions with portfolio actions
    const enhancedActions = [
      ...taxActions,
      ...portfolioActions
    ]
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 10); // Keep top 10 actions
    
    // Calculate FI progress
    const fiProgress = ((totalValue / 1000000) * 100).toFixed(1);
    
    // ENHANCED: Status intelligence with tax insights
    const enhancedStatusIntelligence = {
      fiProgress: `${fiProgress}% to first million`,
      urgentAction: enhancedActions[0]?.title || 'Portfolio optimized',
      deadline: `${taxIntelligence.srsOptimization.daysToDeadline} days to SRS deadline`,
      netWorth: totalValue,
      // Tax-specific status indicators
      srsDeadline: `${taxIntelligence.srsOptimization.daysToDeadline} days`,
      taxSavingsAvailable: taxIntelligence.srsOptimization.taxSavings,
      hasUrgentTaxActions: taxActions.some(a => a.type === 'urgent'),
      urgentTaxAction: taxActions.find(a => a.type === 'urgent')?.title || null
    };
    
    updateRateLimit(userId);
    
    // Match the exact structure your dashboard expects
    
    // Match the exact structure your dashboard expects
    return NextResponse.json({
      success: true,
      intelligence: {
        statusIntelligence: enhancedStatusIntelligence,
        actionIntelligence: enhancedActions,
        allocationIntelligence: categoryData, // Use processed category data
        generated: new Date().toISOString(),
        nextRefresh: new Date(Date.now() + 3600000).toISOString() // 1 hour cache
      },
      // Additional data for future use
      taxIntelligence,
      employmentPassIntel: {
        srsOpportunity: {
          taxSavings: taxIntelligence.srsOptimization.taxSavings,
          daysToDeadline: taxIntelligence.srsOptimization.daysToDeadline,
          urgencyLevel: taxIntelligence.srsOptimization.urgencyLevel,
          monthlyTarget: taxIntelligence.srsOptimization.monthlyTarget
        },
        advantage: taxIntelligence.employmentPassAdvantage,
        estimatedIncome
      },
      metadata: {
        generated: new Date().toISOString(),
        nextRefresh: new Date(Date.now() + 3600000).toISOString(),
        version: '1.4.0', // Version bump for architectural fix
        costProfile: 'zero-ai-costs',
        userId: userId,
        holdingsCount: formattedHoldings.length,
        taxEnhancement: 'consolidated-singapore-tax',
        incomeEstimation: 'conservative-default'
      }
    });
    
  } catch (error) {
    console.error('Enhanced intelligence generation error:', error);
    
    // Enhanced fallback with basic tax intelligence
    const fallbackTaxIntel = generateTaxIntelligence(120000, 0, 'Employment Pass');
    const fallbackTaxActions = convertTaxIntelligenceToActions(fallbackTaxIntel);
    
    return NextResponse.json({
      success: false,
      error: 'Intelligence generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: getFallbackIntelligence([]),
      // Even in fallback, provide basic tax intelligence
      taxIntelligence: fallbackTaxIntel,
      employmentPassIntel: {
        srsOpportunity: {
          taxSavings: fallbackTaxIntel.srsOptimization.taxSavings,
          daysToDeadline: fallbackTaxIntel.srsOptimization.daysToDeadline,
          urgencyLevel: fallbackTaxIntel.srsOptimization.urgencyLevel,
          monthlyTarget: fallbackTaxIntel.srsOptimization.monthlyTarget
        },
        advantage: fallbackTaxIntel.employmentPassAdvantage,
        estimatedIncome: 120000
      }
    }, { status: 200 });
  }
}

function checkRateLimit(userId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  const limit = 100;
  
  const userLimit = rateLimits.get(userId);
  
  if (!userLimit) {
    rateLimits.set(userId, { count: 1, resetTime: now + dayInMs });
    return { allowed: true };
  }
  
  if (now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + dayInMs });
    return { allowed: true };
  }
  
  if (userLimit.count >= limit) {
    return { allowed: false, resetTime: userLimit.resetTime };
  }
  
  userLimit.count++;
  return { allowed: true };
}

function updateRateLimit(userId: string) {
  const userLimit = rateLimits.get(userId);
  if (userLimit) {
    userLimit.count++;
  }
}