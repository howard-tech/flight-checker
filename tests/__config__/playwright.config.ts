import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: 'tests/__config__/.env.test' });

export default defineConfig({
    testDir: '../e2e',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: [
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }]
    ],
    use: {
        baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['iPhone 14'] } },
    ],
});
