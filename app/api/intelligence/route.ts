import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  analyzePortfolioIntelligence, 
  getFallbackIntelligence,
  type UserProfile 
} from '@/app/lib/portfolioIntelligence';
import { type Holding } from '@/app/lib/types/shared';
import { 
  generateTaxIntelligence, 
  convertTaxIntelligenceToActions, 
  estimateIncomeFromPortfolio 
} from '@/app/lib/singaporeTax';

const prisma = new PrismaClient();
const rateLimits = new Map<string, { count: number; resetTime: number }>();

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
    console.log('Found user ID:', userId);
    
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
    
    console.log('Holdings found:', holdings.length);
    
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

    // Calculate total portfolio value for income estimation
    const totalPortfolioValue = formattedHoldings.reduce((sum, holding) => {
      return sum + holding.valueSGD;
    }, 0);
    
    // Smart income estimation with conservative default
    const estimatedIncome = 120000; // Conservative default until user inputs real income
    
    const userProfile: UserProfile = {
      id: user?.id || userId,
      taxStatus: 'Employment Pass',
      estimatedIncome,
      currentSRSContributions: 0,
      fiGoal: Number(user?.fiGoal || 2500000),
      fiTargetYear: user?.fiTargetYear || 2032,
      riskTolerance: 'moderate'
    };
    
    // EXISTING: Portfolio intelligence analysis
    const intelligenceReport = analyzePortfolioIntelligence(
      formattedHoldings,
      userProfile,
      'SGD'
    );
    
    // CONSOLIDATED: Tax intelligence generation (now from singaporeTax.ts)
    const taxIntelligence = generateTaxIntelligence(
      estimatedIncome, 
      0, // TODO: Get actual SRS contributions from user profile
      'Employment Pass'
    );
    
    // CONSOLIDATED: Convert tax intelligence to action items (now from singaporeTax.ts)
    const taxActions = convertTaxIntelligenceToActions(taxIntelligence);
    
    // ENHANCED: Merge tax actions with existing portfolio actions
    const enhancedActions = [
      ...taxActions,
      ...intelligenceReport.actionIntelligence
    ]
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 10); // Keep top 10 actions
    
    // ENHANCED: Status intelligence with tax insights
    const enhancedStatusIntelligence = {
      ...intelligenceReport.statusIntelligence,
      // Tax-specific status indicators
      srsDeadline: `${taxIntelligence.srsOptimization.daysToDeadline} days`,
      taxSavingsAvailable: taxIntelligence.srsOptimization.taxSavings,
      hasUrgentTaxActions: taxActions.some(a => a.type === 'urgent'),
      urgentTaxAction: taxActions.find(a => a.type === 'urgent')?.title || null
    };
    
    updateRateLimit(userId);
    
    console.log(`Enhanced intelligence generated for user ${userId}:`, {
      holdingsCount: formattedHoldings.length,
      totalValue: intelligenceReport.statusIntelligence.netWorth,
      actionsGenerated: enhancedActions.length,
      taxActionsAdded: taxActions.length,
      estimatedIncome,
      srsOpportunity: taxIntelligence.srsOptimization.taxSavings
    });
    
    // Match the exact structure your dashboard expects
    return NextResponse.json({
      success: true,
      intelligence: {
        statusIntelligence: enhancedStatusIntelligence,
        actionIntelligence: enhancedActions,
        allocationIntelligence: intelligenceReport.allocationIntelligence,
        generated: intelligenceReport.generated,
        nextRefresh: intelligenceReport.nextRefresh
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
        generated: intelligenceReport.generated,
        nextRefresh: intelligenceReport.nextRefresh,
        version: '1.3.0', // Version bump for Phase 1 completion
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