import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/lib/auth-utils'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    // Export all user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        holdings: true,
        yearlyData: true,
        monthlySnapshots: true,
        categories: true,
        fiPlans: true,
        fiMilestones: true,
        srsPlans: true,
        savingsRecords: true,
        incomeRecords: true,
        expenseRecords: true,
        netWorthRecords: true,
        portfolioStrategies: true,
        recommendations: true,
        auditLogs: true,
      }
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        country: userData.country,
        taxStatus: userData.taxStatus,
        primaryCurrency: userData.primaryCurrency,
        fiGoal: userData.fiGoal?.toString(),
        fiTargetYear: userData.fiTargetYear,
        srsLimit: userData.srsLimit?.toString(),
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      data: {
        holdings: userData.holdings,
        yearlyData: userData.yearlyData,
        monthlySnapshots: userData.monthlySnapshots,
        categories: userData.categories,
        fiPlans: userData.fiPlans,
        fiMilestones: userData.fiMilestones,
        srsPlans: userData.srsPlans,
        savingsRecords: userData.savingsRecords,
        incomeRecords: userData.incomeRecords,
        expenseRecords: userData.expenseRecords,
        netWorthRecords: userData.netWorthRecords,
        portfolioStrategies: userData.portfolioStrategies,
        recommendations: userData.recommendations,
        auditLogs: userData.auditLogs,
      }
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="action-bias-data-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
} 