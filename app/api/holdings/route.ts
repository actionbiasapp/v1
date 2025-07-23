import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  handleApiError, 
  validateRequiredFields, 
  createValidationErrorResponse 
} from '@/app/lib/errorHandling';

const prisma = new PrismaClient();

// GET /api/holdings - Fetch all holdings
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
      // Use new multi-currency fields
      valueSGD: Number(holding.valueSGD),
      valueINR: Number(holding.valueINR),
      valueUSD: Number(holding.valueUSD),
      entryCurrency: holding.entryCurrency,
      // Keep backward compatibility with old 'value' field
      value: Number(holding.valueSGD),
      currentValue: Number(holding.valueSGD),
      category: holding.category.name,
      location: holding.location,
      quantity: holding.quantity ? Number(holding.quantity) : null,
      unitPrice: holding.unitPrice ? Number(holding.unitPrice) : null,
      assetType: holding.assetType || null,
      costBasis: holding.costBasis ? Number(holding.costBasis) : null,
      
      // NEW: Daily price fields
      currentUnitPrice: holding.currentUnitPrice ? Number(holding.currentUnitPrice) : null,
      priceUpdated: holding.priceUpdated,
      priceSource: holding.priceSource,
    }));

    return NextResponse.json(formattedHoldings);
  } catch (error) {
    return handleApiError(error, 'GET /api/holdings');
  }
}

// POST /api/holdings - Create new holding
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      symbol,
      name,
      valueSGD,
      valueINR,
      valueUSD,
      value, // Backward compatibility
      entryCurrency = 'SGD',
      category,
      location,
      costBasis,
      quantity,
      unitPrice,
      currentUnitPrice,
      manualPricing,
      assetType,
      userId = 'default-user' // Temporary default user for testing
    } = body;

    // Validation
    const validation = validateRequiredFields(body, ['symbol', 'name', 'category', 'location']);
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.missingFields);
    }

    // Ensure we have valid currency values
    const sgdValue = valueSGD || value || 0;
    const inrValue = valueINR || 0;
    const usdValue = valueUSD || 0;

    if (sgdValue <= 0) {
      return handleApiError(
        new Error('Invalid holding value - value must be greater than 0'),
        'POST /api/holdings'
      );
    }

    // Get or create user (for testing - using default user)
    let user = await prisma.user.findFirst({
      where: { id: userId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          country: 'Singapore',
          taxStatus: 'Employment Pass'
        }
      });
    }

    // Get or create category
    let categoryRecord = await prisma.assetCategory.findFirst({
      where: {
        name: category,
        userId: user.id
      }
    });

    if (!categoryRecord) {
      // Create category if it doesn't exist
      const targetPercentages: { [key: string]: number } = {
        'Core': 25,
        'Growth': 55,
        'Hedge': 10,
        'Liquidity': 10
      };

      categoryRecord = await prisma.assetCategory.create({
        data: {
          name: category,
          targetPercentage: targetPercentages[category] || 20,
          userId: user.id,
          description: `${category} investments`
        }
      });
    }

    // Create the holding
    const newHolding = await prisma.holdings.create({
      data: {
        symbol: symbol.toUpperCase(),
        name,
        valueSGD: sgdValue,
        valueINR: inrValue,
        valueUSD: usdValue,
        entryCurrency,
        location,
        categoryId: categoryRecord.id,
        userId: user.id,
        costBasis: costBasis || null,
        quantity: quantity || null,
        unitPrice: unitPrice || null,
        currentUnitPrice: currentUnitPrice || null,
        priceSource: manualPricing ? 'manual' : null,
        assetType: assetType || null
      },
      include: {
        category: true
      }
    });

    // Format response
    const responseData = {
      id: newHolding.id,
      symbol: newHolding.symbol,
      name: newHolding.name,
      valueSGD: Number(newHolding.valueSGD),
      valueINR: Number(newHolding.valueINR),
      valueUSD: Number(newHolding.valueUSD),
      entryCurrency: newHolding.entryCurrency,
      value: Number(newHolding.valueSGD),
      currentValue: Number(newHolding.valueSGD),
      category: newHolding.category.name,
      location: newHolding.location,
      quantity: newHolding.quantity ? Number(newHolding.quantity) : null,
      unitPrice: newHolding.unitPrice ? Number(newHolding.unitPrice) : null,
      assetType: newHolding.assetType || null,
      costBasis: newHolding.costBasis ? Number(newHolding.costBasis) : null
    };

    return NextResponse.json({
      message: 'Holding created successfully',
      holding: responseData
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error, 'POST /api/holdings');
  }
}