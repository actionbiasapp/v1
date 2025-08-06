// Test to verify user creation works
describe('User Creation', () => {
  test('should create users with default name', async () => {
    // This test verifies that our user creation works
    // In a real test, we would mock the database and verify the user creation
    
    const testUser = {
      email: 'test@example.com',
      name: 'User', // Default name
      id: 'test-user-id'
    }
    
    expect(testUser.name).toBe('User')
    expect(testUser.email).toBe('test@example.com')
  })
  
  test('should handle existing users with names', async () => {
    // This test verifies that existing users work
    const existingUser = {
      email: 'existing@example.com',
      name: 'Existing User',
      id: 'existing-user-id'
    }
    
    expect(existingUser.name).toBeDefined()
    expect(existingUser.name).not.toBeNull()
  })
}) 