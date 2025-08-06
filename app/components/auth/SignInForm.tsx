'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function SignInForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('email', {
        email,
        callbackUrl: '/',
        redirect: false,
      })
      
      if (result?.ok) {
        setIsSent(true)
      } else {
        setError('Failed to send magic link. Please try again.')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full" style={{ background: 'var(--success-bg)' }}>
          <svg className="h-6 w-6" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Check your email
        </h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          We've sent a secure link to {email}
        </p>
        <div className="mt-6">
          <button
            onClick={() => {
              setIsSent(false)
              setEmail('')
            }}
            className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--accent-primary)' }}
          >
            Try a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
          style={{
            background: 'var(--bg-tertiary)',
            borderColor: 'var(--glass-border)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-sm)'
          }}
          placeholder="your@email.com"
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <div className="text-sm p-3 rounded-md" style={{
          color: 'var(--error-text)',
          background: 'var(--error-bg)',
          border: '1px solid var(--error-border)'
        }}>
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isLoading || !email}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'var(--accent-gradient)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {isLoading ? 'Sending...' : 'Send secure link'}
      </button>
    </form>
  )
} 