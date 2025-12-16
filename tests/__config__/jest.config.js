module.exports = {
    rootDir: '..',
    testEnvironment: 'node',
    testMatch: [
        '**/*.test.js',
        '!**/e2e/**'
    ],
    coverageDirectory: '<rootDir>/coverage',
    collectCoverageFrom: [
        '**/*.js',
        '!node_modules/**',
        '!coverage/**',
        '!**/__config__/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/__config__/jest.setup.js'],
    testTimeout: 30000,
    verbose: true,
    moduleNameMapper: {
        '@fixtures/(.*)': '<rootDir>/fixtures/$1',
        '@utils/(.*)': '<rootDir>/utils/$1',
        '@mocks/(.*)': '<rootDir>/mocks/$1'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@faker-js)/)'
    ],
    globalSetup: '<rootDir>/__config__/globalSetup.js',
    globalTeardown: '<rootDir>/__config__/globalTeardown.js'
};
