import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const holdings = await prisma.holdings.findMany({
      include: {
        category: true,
      },
    });

    const formattedHoldings = holdings.map(holding => ({
      id: holding.id,
      symbol: holding.symbol,
      name: holding.name,
      value: Number(holding.currentValue),
      category: holding.category.name,
      location: holding.location,
    }));

    return NextResponse.json(formattedHoldings);
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 });
  }
}