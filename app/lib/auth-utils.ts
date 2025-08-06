import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - No valid session')
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user) {
    throw new Error('Unauthorized - User not found')
  }
  
  return user
}

export async function getCurrentUserId() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - No valid session')
  }
  
  return session.user.id
}

export async function requireAuth() {
  const user = await getCurrentUser()
  return user
}

export async function isAuthenticated() {
  try {
    await getCurrentUser()
    return true
  } catch {
    return false
  }
} 