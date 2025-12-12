const baseConfig = require('../__config__/jest.config.js');

module.exports = {
    ...baseConfig,
    testMatch: [
        '<rootDir>/advanced/**/*.test.js',
        '<rootDir>/chaos/**/*.test.js',
        '<rootDir>/load/**/*.test.js',
        '<rootDir>/security/**/*.test.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/__config__/jest.setup.js'],
    testTimeout: 60000,
    transformIgnorePatterns: [
        'node_modules/(?!(@faker-js)/)'
    ]
};
