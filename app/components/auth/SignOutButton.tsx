'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="px-4 py-2 rounded-md font-medium transition-all"
      style={{
        background: 'var(--error-bg)',
        color: 'var(--error-text)',
        border: '1px solid var(--error-border)'
      }}
    >
      Sign Out
    </button>
  )
} 