// app/api/agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PortfolioAgent } from '@/app/lib/agent/agentService';
import { AgentRequest, AgentAction } from '@/app/lib/agent/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, action } = body;
    
    // Handle action execution (for confirmed actions)
    if (action) {
      const result = await PortfolioAgent.executeAction(action as AgentAction);
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result.data
      });
    }
    
    // Handle message processing
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }
    
    const agentRequest: AgentRequest = {
      message,
      context: context || {
        currentHoldings: [],
        yearlyData: [],
        financialProfile: {},
        displayCurrency: 'SGD'
      }
    };
    
    const response = await PortfolioAgent.processMessage(agentRequest);
    
    return NextResponse.json({
      success: true,
      ...response
    });
    
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Sorry, I encountered an error. Please try again.'
    }, { status: 500 });
  }
} 