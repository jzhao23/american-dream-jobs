/**
 * Jest Test Setup
 *
 * This file is executed before each test file runs.
 * It sets up global mocks and configuration for the test environment.
 */

// Mock console.error and console.log during tests to reduce noise
const originalError = console.error;
const originalLog = console.log;

beforeAll(() => {
  // Suppress expected error logs during tests
  console.error = (...args: unknown[]) => {
    // Allow specific error messages through for debugging
    if (args[0] && typeof args[0] === 'string' && args[0].includes('TEST_DEBUG')) {
      originalError(...args);
    }
  };

  // Suppress console.log during tests unless debugging
  console.log = (...args: unknown[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('TEST_DEBUG')) {
      originalLog(...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
});

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        mockGeocodingData: () => typeof import('./fixtures/msa-geocoding.fixture').mockGeocodingData;
        mockLocalCareersIndex: () => typeof import('./fixtures/local-careers-index.fixture').mockLocalCareersIndex;
      };
    }
  }
}

// Export for TypeScript module resolution
export {};
