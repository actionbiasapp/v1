import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/lib/auth-utils'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    
    // Delete all user data (cascade will handle related records)
    await prisma.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
} 