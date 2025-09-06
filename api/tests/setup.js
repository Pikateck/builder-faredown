/**
 * Jest Test Setup
 * Global setup for all pricing engine tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.DEBUG_PRICING = 'true';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test helpers
global.createMockPricingParams = (overrides = {}) => ({
  module: 'air',
  baseFare: 500,
  currency: 'USD',
  userType: 'b2c',
  ...overrides
});

global.createMockMarkupRule = (overrides = {}) => ({
  id: 1,
  module: 'air',
  markup_type: 'percent',
  markup_value: 8.00,
  priority: 10,
  status: 'active',
  ...overrides
});

global.createMockPromoCode = (overrides = {}) => ({
  id: 1,
  code: 'WELCOME10',
  type: 'percent',
  value: 10.00,
  status: 'active',
  ...overrides
});

global.createMockTaxPolicy = (overrides = {}) => ({
  id: 1,
  module: 'air',
  type: 'percent',
  value: 12.00,
  status: 'active',
  ...overrides
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Setup fake timers for consistent test runs
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-09-06T10:00:00Z'));
});

afterAll(() => {
  jest.useRealTimers();
});
