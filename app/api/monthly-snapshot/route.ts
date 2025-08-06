import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/app/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    
    const snapshots = await prisma.monthlySnapshot.findMany({
      where: { userId: user.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
    
    return NextResponse.json({ success: true, data: snapshots });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    
    const body = await request.json();
    const { year, month, income, expenses, portfolioValue, netWorth, notes } = body;
    
    const snapshot = await prisma.monthlySnapshot.create({
      data: {
        userId: user.id,
        year,
        month,
        income: income ?? 0,
        expenses: expenses ?? 0,
        portfolioValue: portfolioValue ?? 0,
        netWorth: netWorth ?? 0,
        notes: notes || null,
      },
    });
    
    return NextResponse.json({ success: true, data: snapshot });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    
    const body = await request.json();
    const { year, month, income, expenses, portfolioValue, netWorth, notes } = body;
    
    const snapshot = await prisma.monthlySnapshot.update({
      where: { userId_year_month: { userId: user.id, year, month } },
      data: {
        income: income ?? 0,
        expenses: expenses ?? 0,
        portfolioValue: portfolioValue ?? 0,
        netWorth: netWorth ?? 0,
        notes: notes || null,
      },
    });
    
    return NextResponse.json({ success: true, data: snapshot });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    
    const body = await request.json();
    const { year, month } = body;
    
    await prisma.monthlySnapshot.delete({
      where: { userId_year_month: { userId: user.id, year, month } },
    });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
} 