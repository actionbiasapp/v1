import { authOptions } from '@/app/lib/auth'
import { getCurrentUser, getCurrentUserId } from '@/app/lib/auth-utils'

describe('Authentication Setup', () => {
  test('authOptions should be properly configured', () => {
    expect(authOptions).toBeDefined()
    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0].id).toBe('email')
    expect(authOptions.session.strategy).toBe('jwt')
  })

  test('authOptions should have required pages', () => {
    expect(authOptions.pages).toBeDefined()
    expect(authOptions.pages.signIn).toBe('/auth/signin')
    expect(authOptions.pages.verifyRequest).toBe('/auth/verify-request')
  })

  test('authOptions should have JWT callbacks', () => {
    expect(authOptions.callbacks).toBeDefined()
    expect(authOptions.callbacks.jwt).toBeDefined()
    expect(authOptions.callbacks.session).toBeDefined()
  })
})

describe('Auth Utils', () => {
  test('getCurrentUser should throw when no session', async () => {
    await expect(getCurrentUser()).rejects.toThrow('Unauthorized')
  })

  test('getCurrentUserId should throw when no session', async () => {
    await expect(getCurrentUserId()).rejects.toThrow('Unauthorized')
  })
}) 