// Test script for registration debugging
const testRegistration = async () => {
  try {
    console.log("Testing registration endpoint...");
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testPass123!',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    return data;
  } catch (error) {
    console.error('Registration test error:', error);
    return { error: error.message };
  }
};

// For browser console
if (typeof window !== 'undefined') {
  window.testRegistration = testRegistration;
  console.log('🧪 Registration test loaded. Run: testRegistration()');
}

module.exports = testRegistration;
