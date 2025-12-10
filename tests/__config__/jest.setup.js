require('dotenv').config({ path: __dirname + '/.env.test' });

jest.setTimeout(30000);

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
