import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCurrentUser() {
  // For now, return a default user ID - in production this would come from auth
  return { id: 'default-user' };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const milestones = await prisma.fIMilestone.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ success: true, milestones });
  } catch (error) {
    console.error('Failed to fetch FI milestones:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch milestones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, amount, description, order } = body;

    if (!name || !amount) {
      return NextResponse.json({ success: false, error: 'Name and amount are required' }, { status: 400 });
    }

    // If no order is provided, get the next order number
    let milestoneOrder = order;
    if (milestoneOrder === undefined) {
      const lastMilestone = await prisma.fIMilestone.findFirst({
        where: { userId: user.id, isActive: true },
        orderBy: { order: 'desc' }
      });
      milestoneOrder = (lastMilestone?.order || 0) + 1;
    }

    const milestone = await prisma.fIMilestone.create({
      data: {
        userId: user.id,
        name,
        amount: amount,
        description: description || null,
        order: milestoneOrder
      }
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error) {
    console.error('Failed to create FI milestone:', error);
    return NextResponse.json({ success: false, error: 'Failed to create milestone' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, amount, description, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Milestone ID is required' }, { status: 400 });
    }

    const milestone = await prisma.fIMilestone.update({
      where: { id, userId: user.id },
      data: {
        name,
        amount: amount !== undefined ? amount : undefined,
        description: description !== undefined ? description : undefined,
        order: order !== undefined ? order : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error) {
    console.error('Failed to update FI milestone:', error);
    return NextResponse.json({ success: false, error: 'Failed to update milestone' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Milestone ID is required' }, { status: 400 });
    }

    // Soft delete by setting isActive to false
    await prisma.fIMilestone.update({
      where: { id, userId: user.id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete FI milestone:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete milestone' }, { status: 500 });
  }
} 