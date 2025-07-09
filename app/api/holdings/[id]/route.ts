import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { convertToAllCurrencies, type CurrencyCode } from '@/app/lib/currency';
import { getCurrentExchangeRates } from '@/app/lib/exchangeRates';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const holding = await prisma.holdings.findUnique({
      where: { id: params.id },
      include: { category: true }
    });

    if (!holding) {
      return NextResponse.json(
        { error: 'Holding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      holding: {
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        valueSGD: Number(holding.valueSGD),
        valueINR: Number(holding.valueINR),
        valueUSD: Number(holding.valueUSD),
        entryCurrency: holding.entryCurrency,
        value: Number(holding.valueSGD),
        category: holding.category.name,
        location: holding.location,
        quantity: holding.quantity ? Number(holding.quantity) : null,
        costBasis: holding.costBasis ? Number(holding.costBasis) : null,
        updatedAt: holding.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching holding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holding' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const {
      symbol,
      name,
      valueSGD,
      valueINR,
      valueUSD,
      value,
      entryCurrency = 'SGD',
      location,
      costBasis,
      quantity
    } = body;

    if (!symbol || !name) {
      return NextResponse.json(
        { error: 'Symbol and name are required' },
        { status: 400 }
      );
    }

    const exchangeRates = await getCurrentExchangeRates();
    let inputValue: number;
    let inputCurrency: CurrencyCode = entryCurrency as CurrencyCode;

    if (valueSGD !== undefined) {
      inputValue = valueSGD;
      inputCurrency = 'SGD';
    } else if (valueINR !== undefined) {
      inputValue = valueINR;
      inputCurrency = 'INR';
    } else if (valueUSD !== undefined) {
      inputValue = valueUSD;
      inputCurrency = 'USD';
    } else if (value !== undefined) {
      inputValue = value;
      inputCurrency = 'SGD';
    } else {
      return NextResponse.json(
        { error: 'At least one value is required' },
        { status: 400 }
      );
    }

    const convertedValues = convertToAllCurrencies(inputValue, inputCurrency, exchangeRates);

    const updatedHolding = await prisma.holdings.update({
      where: { id: params.id },
      data: {
        symbol: symbol.toUpperCase(),
        name,
        valueSGD: convertedValues.valueSGD,
        valueINR: convertedValues.valueINR,
        valueUSD: convertedValues.valueUSD,
        entryCurrency: inputCurrency,
        location,
        costBasis: costBasis || null,
        quantity: quantity || null,
        updatedAt: new Date()
      },
      include: { category: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Holding updated successfully',
      holding: {
        id: updatedHolding.id,
        symbol: updatedHolding.symbol,
        name: updatedHolding.name,
        valueSGD: Number(updatedHolding.valueSGD),
        valueINR: Number(updatedHolding.valueINR),
        valueUSD: Number(updatedHolding.valueUSD),
        entryCurrency: updatedHolding.entryCurrency,
        value: Number(updatedHolding.valueSGD),
        category: updatedHolding.category.name,
        location: updatedHolding.location,
        quantity: updatedHolding.quantity ? Number(updatedHolding.quantity) : null,
        costBasis: updatedHolding.costBasis ? Number(updatedHolding.costBasis) : null,
        updatedAt: updatedHolding.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating holding:', error);
    return NextResponse.json(
      { error: 'Failed to update holding' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const existingHolding = await prisma.holdings.findUnique({
      where: { id: params.id }
    });

    if (!existingHolding) {
      return NextResponse.json(
        { error: 'Holding not found' },
        { status: 404 }
      );
    }

    await prisma.holdings.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Holding deleted successfully',
      deletedHolding: {
        id: existingHolding.id,
        symbol: existingHolding.symbol,
        name: existingHolding.name
      }
    });

  } catch (error) {
    console.error('Error deleting holding:', error);
    return NextResponse.json(
      { error: 'Failed to delete holding' },
      { status: 500 }
    );
  }
}
