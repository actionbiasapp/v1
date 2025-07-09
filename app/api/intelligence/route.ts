import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  analyzePortfolioIntelligence, 
  getFallbackIntelligence,
  type Holding,
  type UserProfile 
} from '@/app/lib/portfolioIntelligence';

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
    
    const userProfile: UserProfile = {
      id: user?.id || userId,
      taxStatus: 'Employment Pass',
      estimatedIncome: 120000,
      currentSRSContributions: 0,
      fiGoal: Number(user?.fiGoal || 2500000),
      fiTargetYear: user?.fiTargetYear || 2032,
      riskTolerance: 'moderate'
    };
    
    const intelligenceReport = analyzePortfolioIntelligence(
      formattedHoldings,
      userProfile,
      'SGD'
    );
    
    updateRateLimit(userId);
    
    console.log(`Intelligence generated for user ${userId}:`, {
      holdingsCount: formattedHoldings.length,
      totalValue: intelligenceReport.statusIntelligence.netWorth,
      actionsGenerated: intelligenceReport.actionIntelligence.length
    });
    
    return NextResponse.json({
      success: true,
      intelligence: intelligenceReport,
      metadata: {
        generated: intelligenceReport.generated,
        nextRefresh: intelligenceReport.nextRefresh,
        version: '1.0.0',
        costProfile: 'zero-ai-costs',
        userId: userId,
        holdingsCount: formattedHoldings.length
      }
    });
    
  } catch (error) {
    console.error('Intelligence generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Intelligence generation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: getFallbackIntelligence([])
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
