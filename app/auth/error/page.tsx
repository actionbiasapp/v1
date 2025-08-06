'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'EmailCreateAccount':
        return 'Unable to create account. Please try again.'
      case 'Verification':
        return 'Email verification failed. Please try again.'
      case 'Configuration':
        return 'Authentication configuration error. Please contact support.'
      case 'AccessDenied':
        return 'Access denied. Please check your credentials.'
      default:
        return 'An authentication error occurred. Please try again.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full space-y-8 text-center p-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full" style={{ background: 'var(--error-bg)' }}>
          <svg className="h-6 w-6" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Authentication Error
        </h2>
        
        <p style={{ color: 'var(--text-secondary)' }}>
          {getErrorMessage(error)}
        </p>
        
        <div className="p-4 rounded-md border" style={{
          background: 'var(--error-bg)',
          borderColor: 'var(--error-border)'
        }}>
          <h3 className="text-sm font-medium" style={{ color: 'var(--error-text)' }}>
            What you can do:
          </h3>
          <ul className="mt-2 text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>• Try signing in again</li>
            <li>• Check your email address</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/auth/signin"
            className="inline-block px-4 py-2 rounded-md font-medium transition-all"
            style={{
              background: 'var(--accent-gradient)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            Try Again
          </Link>
          
          <div>
            <Link 
              href="/"
              className="text-sm hover:opacity-80 transition-opacity"
              style={{ color: 'var(--accent-primary)' }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
} 