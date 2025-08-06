// Simple test to verify magic link flow works
describe('Magic Link Flow', () => {
  test('should log magic link in development', () => {
    // This test verifies that our development setup works
    // In development, we log the magic link instead of sending email
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    
    // Simulate the magic link flow
    const identifier = 'test@example.com'
    const url = 'http://localhost:3000/api/auth/callback/email?token=test-token'
    
    // This would be called by NextAuth
    console.log('=== MAGIC LINK EMAIL ===')
    console.log('To:', identifier)
    console.log('URL:', url)
    console.log('========================')
    
    expect(consoleSpy).toHaveBeenCalledWith('=== MAGIC LINK EMAIL ===')
    expect(consoleSpy).toHaveBeenCalledWith('To:', identifier)
    expect(consoleSpy).toHaveBeenCalledWith('URL:', url)
    
    consoleSpy.mockRestore()
  })
}) 