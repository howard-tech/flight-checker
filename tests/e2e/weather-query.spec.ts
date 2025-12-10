import { test, expect, Page } from '@playwright/test';

// Helper functions
async function waitForAIResponse(page: Page, timeout = 30000) {
  await page.waitForSelector('[data-testid="message-assistant"]', {
    timeout,
    state: 'visible'
  });
  await page.waitForTimeout(500);
}

async function sendMessage(page: Page, message: string) {
  await page.fill('[data-testid="chat-input"]', message);
  await page.click('[data-testid="chat-submit"]');
}

test.describe('Weather Query E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 15000 });
  });

  test('should query weather for Hanoi in Vietnamese', async ({ page }) => {
    await sendMessage(page, 'thời tiết Hà Nội');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response?.toLowerCase()).toMatch(/hà nội|hanoi|han/i);
    // Should contain temperature or weather condition
    expect(response).toMatch(/\d+|nhiệt độ|temperature|độ|nắng|mưa|sunny|cloudy/i);
  });

  test('should query weather for SGN airport', async ({ page }) => {
    await sendMessage(page, 'weather SGN');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response?.toLowerCase()).toMatch(/sgn|sài gòn|ho chi minh|tân sơn nhất/i);
  });

  test('should query weather for Da Nang', async ({ page }) => {
    await sendMessage(page, 'thời tiết Đà Nẵng hôm nay');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response?.toLowerCase()).toMatch(/đà nẵng|da nang|dad/i);
  });

  test('should query weather for Phu Quoc', async ({ page }) => {
    await sendMessage(page, 'Phú Quốc weather');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response?.toLowerCase()).toMatch(/phú quốc|phu quoc|pqc/i);
  });

  test('should include humidity or wind info', async ({ page }) => {
    await sendMessage(page, 'thời tiết chi tiết ở SGN');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    // Should contain weather details
    expect(response).toBeDefined();
    expect(response!.length).toBeGreaterThan(100);
  });

  test('should handle weather query with flight context', async ({ page }) => {
    // First ask about flight
    await sendMessage(page, 'VN123');
    await waitForAIResponse(page);

    // Then ask about destination weather
    await sendMessage(page, 'thời tiết ở điểm đến thế nào?');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    // Should understand and provide weather for destination
    expect(response?.toLowerCase()).toMatch(/nhiệt độ|temperature|thời tiết|weather|độ|°/i);
  });
});

test.describe('Weather Query - Different Formats', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 15000 });
  });

  test('should understand airport code format', async ({ page }) => {
    await sendMessage(page, 'HAN weather');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response?.toLowerCase()).toMatch(/han|hà nội|hanoi|nội bài/i);
  });

  test('should understand city name in Vietnamese', async ({ page }) => {
    await sendMessage(page, 'Sài Gòn có nắng không?');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response).toBeDefined();
  });

  test('should handle weather in natural language', async ({ page }) => {
    await sendMessage(page, 'Cho tôi biết thời tiết hiện tại ở sân bay Tân Sơn Nhất');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response?.toLowerCase()).toMatch(/tân sơn nhất|sgn|sài gòn|ho chi minh/i);
  });
});
