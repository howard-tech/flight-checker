require('dotenv').config({ path: '.env.test' });

// Increase timeout for API calls
jest.setTimeout(30000);

// Global test hooks
beforeAll(() => {
  console.log('🧪 Starting test suite...');
  console.log(`   API URL: ${process.env.API_BASE_URL}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
