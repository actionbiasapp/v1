import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEV_EMAIL = 'dev@local.test';

// Helper to get dev user
async function getDevUser() {
  return prisma.user.findFirst({ where: { email: DEV_EMAIL } });
}

export async function GET() {
  const user = await getDevUser();
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  
  const snapshots = await prisma.monthlySnapshot.findMany({
    where: { userId: user.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });
  
  return NextResponse.json({ success: true, data: snapshots });
}

export async function POST(request: NextRequest) {
  const user = await getDevUser();
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  
  const body = await request.json();
  const { year, month, income, expenses, portfolioValue, netWorth, notes } = body;
  
  try {
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
  const user = await getDevUser();
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  
  const body = await request.json();
  const { year, month, income, expenses, portfolioValue, netWorth, notes } = body;
  
  try {
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
  const user = await getDevUser();
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  
  const body = await request.json();
  const { year, month } = body;
  
  try {
    await prisma.monthlySnapshot.delete({
      where: { userId_year_month: { userId: user.id, year, month } },
    });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
} 