/**
 * Jest Configuration for Pricing Engine Tests
 */

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  collectCoverageFrom: [
    "services/**/*.js",
    "routes/**/*.js",
    "middleware/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
  ],
  coverageDirectory: "tests/coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
