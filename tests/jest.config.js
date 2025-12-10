module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/api/**/*.test.js',
    '**/integration/**/*.test.js',
    '**/unit/**/*.test.js'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!e2e/**',
    '!*.config.js'
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};
