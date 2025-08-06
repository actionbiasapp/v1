import { authOptions } from '@/app/lib/auth'

describe('Authentication Integration', () => {
  test('authOptions should be properly configured', () => {
    // Test that authOptions exists and has required properties
    expect(authOptions).toBeDefined()
    expect(authOptions.providers).toBeDefined()
    expect(authOptions.providers).toHaveLength(1)
    
    // Test that we have an email provider
    const emailProvider = authOptions.providers[0]
    expect(emailProvider.id).toBe('email')
    
    // Test session configuration
    expect(authOptions.session).toBeDefined()
    expect(authOptions.session.strategy).toBe('jwt')
    
    // Test callbacks
    expect(authOptions.callbacks).toBeDefined()
    expect(authOptions.callbacks.jwt).toBeDefined()
    expect(authOptions.callbacks.session).toBeDefined()
    
    // Test pages
    expect(authOptions.pages).toBeDefined()
    expect(authOptions.pages.signIn).toBe('/auth/signin')
    expect(authOptions.pages.verifyRequest).toBe('/auth/verify-request')
  })

  test('environment variables should be configured', () => {
    // Test that required env vars are set (even if they're placeholder values)
    expect(process.env.NEXTAUTH_SECRET).toBeDefined()
    expect(process.env.NEXTAUTH_URL).toBeDefined()
    expect(process.env.EMAIL_SERVER_HOST).toBeDefined()
    expect(process.env.EMAIL_SERVER_PORT).toBeDefined()
  })
}) 