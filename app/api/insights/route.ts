// app/api/insights/route.ts - Dynamic Portfolio Insights API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  generateComprehensiveInsights,
  calculatePortfolioMetrics,
  type PortfolioInsight 
} from '@/app/lib/aiInsights';
import { 
  generateTaxOptimizationInsights,
  calculateSRSOptimization,
  estimateIncomeFromPortfolio 
} from '@/app/lib/singaporeTax';

const prisma = new PrismaClient();

interface InsightsResponse {
  success: boolean;
  insights: PortfolioInsight[];
  portfolioMetrics: {
    totalValue: number;
    holdingsCount: number;
    diversificationScore: number;
    categoryBreakdown: Record<string, number>;
  };
  taxIntelligence: {
    srsRecommendation: number;
    taxSavings: number;
    monthlyTarget: number;
    urgencyLevel: string;
    urgencyDays: number;
    employmentPassAdvantage: number;
  };
  lastUpdated: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Get from authentication - for now, find any user's holdings
    // First, get the user ID from existing holdings
    const allHoldings = await prisma.holdings.findMany({
      take: 1,
      select: { userId: true }
    });
    
    const userId = allHoldings.length > 0 ? allHoldings[0].userId : 'default-user';

    
    // Fetch user's current portfolio
    const holdings = await prisma.holdings.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { valueSGD: 'desc' }
    });



    if (holdings.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No holdings found for analysis',
        insights: [],
        portfolioMetrics: {
          totalValue: 0,
          holdingsCount: 0,
          diversificationScore: 0,
          categoryBreakdown: {}
        },
        taxIntelligence: {
          srsRecommendation: 0,
          taxSavings: 0,
          monthlyTarget: 0,
          urgencyLevel: 'low',
          urgencyDays: 0,
          employmentPassAdvantage: 0
        },
        lastUpdated: new Date().toISOString()
      });
    }

    // Format holdings for analysis
    const formattedHoldings = holdings.map(holding => ({
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

    const totalValue = formattedHoldings.reduce((sum, h) => sum + h.valueSGD, 0);
    
    // Calculate portfolio metrics
    const portfolioMetrics = calculatePortfolioMetrics(formattedHoldings);
    
    // Generate comprehensive portfolio insights
    const portfolioInsights = generateComprehensiveInsights(formattedHoldings);
    
    // Generate tax optimization insights
    const estimatedIncome = estimateIncomeFromPortfolio(totalValue);
    const taxInsights = generateTaxOptimizationInsights(
      formattedHoldings,
      totalValue,
      estimatedIncome
    );
    
    // Calculate SRS analysis for tax intelligence
    const srsAnalysis = calculateSRSOptimization(estimatedIncome, 0, 'Employment Pass');
    
    // Combine all insights and sort by priority
    const allInsights = [
      ...portfolioInsights,
      ...taxInsights.map(insight => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        title: insight.title,
        problem: insight.problem,
        solution: insight.solution,
        benefit: insight.benefit,
        dollarImpact: insight.dollarImpact,
        timeline: insight.timeline,
        actionText: insight.actionText,
        priority: insight.priority,
        isClickable: insight.isClickable,
        metadata: insight.metadata
      }))
    ].sort((a, b) => b.priority - a.priority).slice(0, 8);

    const response: InsightsResponse = {
      success: true,
      insights: allInsights,
      portfolioMetrics: {
        totalValue: portfolioMetrics.totalValue,
        holdingsCount: formattedHoldings.length,
        diversificationScore: portfolioMetrics.diversificationScore,
        categoryBreakdown: portfolioMetrics.categoryBreakdown
      },
      taxIntelligence: {
        srsRecommendation: srsAnalysis.recommendedContribution,
        taxSavings: srsAnalysis.taxSavings,
        monthlyTarget: srsAnalysis.monthlyTarget,
        urgencyLevel: srsAnalysis.urgencyLevel,
        urgencyDays: srsAnalysis.urgencyDays,
        employmentPassAdvantage: srsAnalysis.employmentPassAdvantage
      },
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate insights',
      insights: [],
      portfolioMetrics: {
        totalValue: 0,
        holdingsCount: 0,
        diversificationScore: 0,
        categoryBreakdown: {}
      },
      taxIntelligence: {
        srsRecommendation: 0,
        taxSavings: 0,
        monthlyTarget: 0,
        urgencyLevel: 'low',
        urgencyDays: 0,
        employmentPassAdvantage: 0
      },
      lastUpdated: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/insights/action - Handle insight actions
export async function POST(request: NextRequest) {
  try {
    const { actionType, insightId, metadata } = await request.json();
    
    // Log the action for analytics

    
    // Here you could:
    // 1. Save the action to database for tracking
    // 2. Trigger specific workflows based on action type
    // 3. Update user preferences
    // 4. Send notifications
    
    switch (actionType) {
      case 'srs-optimization':
        // Could redirect to SRS calculator or external SRS platform
        return NextResponse.json({
          success: true,
          message: 'SRS optimization action logged',
          nextStep: 'redirect_to_srs_calculator'
        });
        
      case 'cash-deployment':
        // Could suggest specific investments or redirect to portfolio
        return NextResponse.json({
          success: true,
          message: 'Cash deployment action logged',
          nextStep: 'suggest_investments'
        });
        
      case 'rebalancing':
        // Could trigger rebalancing workflow
        return NextResponse.json({
          success: true,
          message: 'Rebalancing action logged',
          nextStep: 'portfolio_rebalancing'
        });
        
      default:
        return NextResponse.json({
          success: true,
          message: 'Action logged successfully'
        });
    }
    
  } catch (error) {
    console.error('Error handling insight action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to handle insight action'
    }, { status: 500 });
  }
}

// DELETE /api/insights/[id] - Dismiss an insight
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const insightId = url.pathname.split('/').pop();
    
    if (!insightId) {
      return NextResponse.json({
        success: false,
        error: 'Insight ID required'
      }, { status: 400 });
    }
    
    // Here you could save dismissed insights to prevent them from reappearing

    
    return NextResponse.json({
      success: true,
      message: 'Insight dismissed successfully'
    });
    
  } catch (error) {
    console.error('Error dismissing insight:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to dismiss insight'
    }, { status: 500 });
  }
}

// Helper function to get user preferences (for future use)
async function getUserPreferences(userId: string) {
  try {
    // TODO: Implement when userPreferences table is added to schema
    // const preferences = await prisma.userPreferences.findUnique({
    //   where: { userId }
    // });
    
    // Return default preferences for now
    return {
      riskTolerance: 'moderate',
      investmentGoal: 'growth',
      srsAutoOptimize: true,
      rebalanceAlert: true,
      taxOptimization: true
    };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return {
      riskTolerance: 'moderate',
      investmentGoal: 'growth',
      srsAutoOptimize: true,
      rebalanceAlert: true,
      taxOptimization: true
    };
  }
}

// Helper function to save insight interactions (for future analytics)
async function saveInsightInteraction(
  userId: string,
  insightId: string,
  actionType: string,
  metadata?: any
) {
  try {
    // This would save to a UserInsightInteraction table
    // Future implementation:
    // await prisma.userInsightInteraction.create({
    //   data: {
    //     userId,
    //     insightId,
    //     actionType,
    //     metadata: JSON.stringify(metadata),
    //     timestamp: new Date()
    //   }
    // });
    
    // Future implementation:
    // await prisma.userInsightInteraction.create({
    //   data: {
    //     userId,
    //     insightId,
    //     actionType,
    //     metadata: JSON.stringify(metadata),
    //     timestamp: new Date()
    //   }
    // });
    
  } catch (error) {
    console.error('Error saving insight interaction:', error);
  }
}