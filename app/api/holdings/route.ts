import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  handleApiError, 
  validateRequiredFields, 
  createValidationErrorResponse 
} from '@/app/lib/errorHandling';
import { getCurrentUserId } from '@/app/lib/auth-utils';

const prisma = new PrismaClient();

// GET /api/holdings - Fetch all holdings for current user
export async function GET() {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    
    const holdings = await prisma.holdings.findMany({
      where: {
        userId: userId
      },
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

// POST /api/holdings - Create new holding for current user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current user ID
    const userId = await getCurrentUserId();
    
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

    // Get or create category
    let categoryRecord = await prisma.assetCategory.findFirst({
      where: { 
        name: category,
        userId: userId
      }
    });

    if (!categoryRecord) {
      categoryRecord = await prisma.assetCategory.create({
        data: {
          name: category,
          userId: userId
        }
      });
    }

    // Create holding with current user ID
    const holding = await prisma.holdings.create({
      data: {
        symbol,
        name,
        valueSGD: sgdValue,
        valueINR: inrValue,
        valueUSD: usdValue,
        entryCurrency,
        location,
        costBasis: costBasis ? Number(costBasis) : null,
        quantity: quantity ? Number(quantity) : null,
        unitPrice: unitPrice ? Number(unitPrice) : null,
        currentUnitPrice: currentUnitPrice ? Number(currentUnitPrice) : null,
        assetType: assetType || null,
        categoryId: categoryRecord.id,
        userId: userId, // Use authenticated user ID
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      message: 'Holding created successfully',
      holding: {
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        valueSGD: Number(holding.valueSGD),
        valueINR: Number(holding.valueINR),
        valueUSD: Number(holding.valueUSD),
        entryCurrency: holding.entryCurrency,
        value: Number(holding.valueSGD),
        currentValue: Number(holding.valueSGD),
        category: holding.category.name,
        location: holding.location,
        quantity: holding.quantity ? Number(holding.quantity) : null,
        unitPrice: holding.unitPrice ? Number(holding.unitPrice) : null,
        assetType: holding.assetType || null,
        costBasis: holding.costBasis ? Number(holding.costBasis) : null,
        currentUnitPrice: holding.currentUnitPrice ? Number(holding.currentUnitPrice) : null,
        priceUpdated: holding.priceUpdated,
        priceSource: holding.priceSource,
      }
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/holdings');
  }
}