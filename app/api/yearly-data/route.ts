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
  const data = await prisma.yearlyData.findMany({ where: { userId: user.id }, orderBy: { year: 'asc' } });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const user = await getDevUser();
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const body = await request.json();
  const { year, netWorth, savings, income, expenses, srs, marketGains, returnPercent, notes } = body;
  try {
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
  const user = await getDevUser();
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const body = await request.json();
  const { year, netWorth, savings, income, expenses, srs, marketGains, returnPercent, notes } = body;
  try {
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
  const user = await getDevUser();
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  const body = await request.json();
  const { year } = body;
  try {
    await prisma.yearlyData.delete({
      where: { userId_year: { userId: user.id, year } },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
} 