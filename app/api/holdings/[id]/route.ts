import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/holdings/[id] - Get individual holding
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const holding = await prisma.holdings.findUnique({
      where: { id },
      include: {
        category: true,
        user: true
      }
    });

    if (!holding) {
      return NextResponse.json(
        { error: 'Holding not found' },
        { status: 404 }
      );
    }

    // Convert Decimal fields to numbers for JSON serialization
    const holdingData = {
      ...holding,
      currentValue: Number(holding.valueSGD), // ✅ Fixed: use valueSGD
      costBasis: holding.costBasis ? Number(holding.costBasis) : null,
      quantity: holding.quantity ? Number(holding.quantity) : null,
      valueSGD: holding.valueSGD ? Number(holding.valueSGD) : Number(holding.valueSGD),
      valueINR: holding.valueINR ? Number(holding.valueINR) : null,
      valueUSD: holding.valueUSD ? Number(holding.valueUSD) : null,
      // Backward compatibility
      value: Number(holding.valueSGD) // ✅ Fixed: use valueSGD (lowercase)
    };

    return NextResponse.json(holdingData);
  } catch (error) {
    console.error('Error fetching holding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holding' },
      { status: 500 }
    );
  }
}

// PUT /api/holdings/[id] - Update holding
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      symbol,
      name,
      valueSGD,
      valueINR,
      valueUSD,
      value, // Backward compatibility
      entryCurrency,
      category,
      location,
      costBasis,
      quantity
    } = body;

    // Validation
    if (!symbol || !name || !category || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, name, category, location' },
        { status: 400 }
      );
    }

    // Check if holding exists
    const existingHolding = await prisma.holdings.findUnique({
      where: { id }
    });

    if (!existingHolding) {
      return NextResponse.json(
        { error: 'Holding not found' },
        { status: 404 }
      );
    }

    // Get or create category
    let categoryRecord = await prisma.assetCategory.findFirst({
      where: {
        name: category,
        userId: existingHolding.userId
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
          userId: existingHolding.userId,
          description: `${category} investments`
        }
      });
    }

    // Prepare update data
    const updateData: any = {
      symbol: symbol.toUpperCase(),
      name,
      categoryId: categoryRecord.id,
      location,
      updatedAt: new Date()
    };

    // Handle multi-currency values
    if (valueSGD !== undefined) {
      updateData.valueSGD = valueSGD; // ✅ Fixed: use valueSGD, not currentValue
    } else if (value !== undefined) {
      // Backward compatibility
      updateData.valueSGD = value; // ✅ Fixed: use valueSGD, not currentValue
    }

    if (valueINR !== undefined) {
      updateData.valueINR = valueINR;
    }

    if (valueUSD !== undefined) {
      updateData.valueUSD = valueUSD;
    }

    if (entryCurrency) {
      updateData.entryCurrency = entryCurrency;
    }

    if (costBasis !== undefined) {
      updateData.costBasis = costBasis;
    }

    if (quantity !== undefined) {
      updateData.quantity = quantity;
    }

    // Update the holding
    const updatedHolding = await prisma.holdings.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    // Convert Decimal fields to numbers for JSON response
    const responseData = {
      ...updatedHolding,
      currentValue: Number(updatedHolding.valueSGD), // ✅ Fixed: use valueSGD
      costBasis: updatedHolding.costBasis ? Number(updatedHolding.costBasis) : null,
      quantity: updatedHolding.quantity ? Number(updatedHolding.quantity) : null,
      valueSGD: updatedHolding.valueSGD ? Number(updatedHolding.valueSGD) : Number(updatedHolding.valueSGD),
      valueINR: updatedHolding.valueINR ? Number(updatedHolding.valueINR) : null,
      valueUSD: updatedHolding.valueUSD ? Number(updatedHolding.valueUSD) : null,
      // Backward compatibility
      value: Number(updatedHolding.valueSGD), // ✅ Fixed: use valueSGD
      category: updatedHolding.category.name
    };

    return NextResponse.json({
      message: 'Holding updated successfully',
      holding: responseData
    });

  } catch (error) {
    console.error('Error updating holding:', error);
    return NextResponse.json(
      { error: 'Failed to update holding' },
      { status: 500 }
    );
  }
}

// DELETE /api/holdings/[id] - Delete holding
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if holding exists
    const existingHolding = await prisma.holdings.findUnique({
      where: { id }
    });

    if (!existingHolding) {
      return NextResponse.json(
        { error: 'Holding not found' },
        { status: 404 }
      );
    }

    // Delete the holding
    await prisma.holdings.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Holding deleted successfully',
      deletedId: id
    });

  } catch (error) {
    console.error('Error deleting holding:', error);
    return NextResponse.json(
      { error: 'Failed to delete holding' },
      { status: 500 }
    );
  }
}