'use client'

import { SessionProvider } from 'next-auth/react'
import { NumberVisibilityProvider } from '../lib/context/NumberVisibilityContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NumberVisibilityProvider>
        {children}
      </NumberVisibilityProvider>
    </SessionProvider>
  )
} 