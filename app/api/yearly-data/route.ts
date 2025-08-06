import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/app/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    
    const data = await prisma.yearlyData.findMany({ 
      where: { userId: user.id }, 
      orderBy: { year: 'asc' } 
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    
    const body = await request.json();
    const { year, netWorth, savings, income, expenses, srs, marketGains, returnPercent, notes } = body;
    
    const created = await prisma.yearlyData.create({
      data: {
        userId: user.id,
        year,
        netWorth: netWorth ?? 0,
        income: income ?? 0,
        expenses: expenses ?? 0,
        savings: savings ?? 0,
        srs: srs ?? 0,
        marketGains: marketGains ?? 0,
        returnPercent: returnPercent ?? 0,
        notes: notes || null,
      },
    });
    return NextResponse.json({ success: true, data: created });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    
    const body = await request.json();
    const { year, netWorth, savings, income, expenses, srs, marketGains, returnPercent, notes } = body;
    
    const updated = await prisma.yearlyData.update({
      where: { userId_year: { userId: user.id, year } },
      data: {
        netWorth: netWorth ?? 0,
        income: income ?? 0,
        expenses: expenses ?? 0,
        savings: savings ?? 0,
        srs: srs ?? 0,
        marketGains: marketGains ?? 0,
        returnPercent: returnPercent ?? 0,
        notes: notes || null,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    
    const body = await request.json();
    const { year } = body;
    
    await prisma.yearlyData.delete({
      where: { userId_year: { userId: user.id, year } },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
} 