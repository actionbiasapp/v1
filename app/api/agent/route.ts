// app/api/agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PortfolioAgent } from '@/app/lib/agent/agentService';
import { AgentRequest } from '@/app/lib/agent/types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, action } = body;

    // Handle action execution
    if (action) {
      const result = await PortfolioAgent.executeAction(action);
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result.data
      });
    }

    // Handle message processing
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get current holdings
    const holdings = await prisma.holdings.findMany({
      include: {
        category: true
      }
    });

    // Get yearly data
    const yearlyData = await prisma.yearlyData.findMany({
      orderBy: { year: 'desc' }
    });

    // Get financial profile from database (stored in User model)
    const user = await prisma.user.findFirst({
      where: { id: 'default' } // Assuming single user for now
    }) || {
      id: 'default',
      email: 'default@example.com',
      name: 'Default User',
      country: 'Singapore',
      taxStatus: 'Employment Pass',
      primaryCurrency: 'SGD',
      birthYear: null,
      srsLimit: 35700,
      fiGoal: 2500000,
      fiTargetYear: 2032,
      profileCompleteness: 0,
      dataQuality: 0,
      yearsOfData: 0,
      lastProfileUpdate: new Date(),
      autoUpdatePortfolio: true,
      shareAnonymizedData: false,
      shareWithAdvisor: false,
      exportDataAllowed: true,
      srsDeadlineReminder: true,
      rebalanceReminder: true,
      fiProgressReminder: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      coreTarget: 25,
      growthTarget: 55,
      hedgeTarget: 10,
      liquidityTarget: 10,
      rebalanceThreshold: 5
    };

    // Get display currency from request or use user's primary currency
    const displayCurrency = body.displayCurrency || user.primaryCurrency || 'SGD';

    // Build agent request
    const agentRequest: AgentRequest = {
      message,
      context: {
        currentHoldings: holdings.map(h => ({
          id: h.id,
          symbol: h.symbol,
          name: h.name,
          valueSGD: Number(h.valueSGD),
          valueINR: Number(h.valueINR),
          valueUSD: Number(h.valueUSD),
          entryCurrency: h.entryCurrency,
          category: h.category.name,
          location: h.location,
          quantity: h.quantity ? Number(h.quantity) : undefined,
          unitPrice: h.unitPrice ? Number(h.unitPrice) : undefined,
          currentUnitPrice: h.currentUnitPrice ? Number(h.currentUnitPrice) : undefined,
          assetType: h.assetType as any
        })),
        yearlyData: yearlyData.map(yd => ({
          year: yd.year,
          netWorth: Number(yd.netWorth),
          income: Number(yd.income),
          expenses: Number(yd.expenses),
          savings: Number(yd.savings),
          srsContributions: Number(yd.srs),
          marketGains: Number(yd.marketGains),
          returnPercent: Number(yd.returnPercent)
        })),
        financialProfile: {
          incomeCurrency: user.primaryCurrency,
          taxStatus: user.taxStatus,
          currentSRSContributions: 0,
          srsAutoOptimize: false,
          fiGoal: Number(user.fiGoal),
          fiTargetYear: user.fiTargetYear,
          firstMillionTarget: false,
          coreTarget: user.coreTarget,
          growthTarget: user.growthTarget,
          hedgeTarget: user.hedgeTarget,
          liquidityTarget: user.liquidityTarget,
          rebalanceThreshold: user.rebalanceThreshold,
          profileCompleteness: user.profileCompleteness
        },
        displayCurrency: displayCurrency as any
      }
    };

    // Process with agent
    const response = await PortfolioAgent.processMessage(agentRequest);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { 
        success: false,
        action: 'error',
        message: 'Internal server error',
        confidence: 0
      },
      { status: 500 }
    );
  }
} 