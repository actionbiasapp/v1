import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('🔍 Debug Session:')
    console.log('Session:', JSON.stringify(session, null, 2))
    console.log('Session exists:', !!session)
    console.log('User exists:', !!session?.user)
    console.log('User ID:', session?.user?.id)
    console.log('User email:', session?.user?.email)
    
    return NextResponse.json({
      success: true,
      session: {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        } : null
      },
      cookies: request.headers.get('cookie') || 'No cookies'
    })
  } catch (error) {
    console.error('❌ Session debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 