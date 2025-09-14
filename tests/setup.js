// Test setup file
// This file runs before each test file

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port for tests

// Increase timeout for async operations
jest.setTimeout(10000);

// Global test cleanup
afterAll(async () => {
  // Wait for any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
