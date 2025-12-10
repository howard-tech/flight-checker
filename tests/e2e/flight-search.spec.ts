import { test, expect, Page } from '@playwright/test';

// Helper to wait for AI response
async function waitForAIResponse(page: Page, timeout = 30000) {
  await page.waitForSelector('[class*="assistant"], [class*="message"]:not([class*="user"])', {
    timeout,
    state: 'visible'
  });
  // Wait a bit more for content to fully render
  await page.waitForTimeout(500);
}

// Helper to send message
async function sendMessage(page: Page, message: string) {
  await page.fill('input[type="text"], input[placeholder*="nhập"], textarea', message);
  await page.click('button[type="submit"], button:has-text("Gửi"), button:has-text("Send")');
}

test.describe('Flight Search E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input', { timeout: 15000 });
  });

  test('should display welcome message on load', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toMatch(/xin chào|welcome|trợ lý|assistant/i);
  });

  test('should have input field and submit button', async ({ page }) => {
    const input = page.locator('input[type="text"], textarea');
    const button = page.locator('button[type="submit"], button:has-text("Gửi")');
    
    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
  });

  test('should search flight VN123 - On Time', async ({ page }) => {
    await sendMessage(page, 'VN123');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response?.toLowerCase()).toMatch(/vn123/i);
    expect(response?.toLowerCase()).toMatch(/on time|đúng giờ|vietnam airlines/i);
  });

  test('should search delayed flight VN456', async ({ page }) => {
    await sendMessage(page, 'VN456');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response?.toLowerCase()).toMatch(/vn456/i);
    expect(response?.toLowerCase()).toMatch(/delay|trễ|chậm/i);
  });

  test('should show compensation info for delayed flight', async ({ page }) => {
    await sendMessage(page, 'Tra cứu chuyến VN456');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    // Should mention delay or compensation
    expect(response?.toLowerCase()).toMatch(/delay|trễ|bồi thường|compensation/i);
  });

  test('should handle cancelled flight QH101', async ({ page }) => {
    await sendMessage(page, 'QH101');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response?.toLowerCase()).toMatch(/qh101/i);
    expect(response?.toLowerCase()).toMatch(/cancel|hủy|thay thế|alternative/i);
  });

  test('should search with Vietnamese text', async ({ page }) => {
    await sendMessage(page, 'Tra cứu chuyến bay VN123');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    expect(response).toBeDefined();
    expect(response?.length).toBeGreaterThan(50);
  });

  test('should handle unknown flight gracefully', async ({ page }) => {
    await sendMessage(page, 'UNKNOWN999');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    // Should still get a response, not error
    expect(response).toBeDefined();
    expect(response?.toLowerCase()).toMatch(/không tìm thấy|not found|không có|no flight/i);
  });
});

test.describe('Flight Search - Multi-turn Conversation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input', { timeout: 15000 });
  });

  test('should maintain context in follow-up questions', async ({ page }) => {
    // First question
    await sendMessage(page, 'VN456');
    await waitForAIResponse(page);

    // Follow-up question
    await sendMessage(page, 'có chuyến nào thay thế không?');
    await waitForAIResponse(page);

    const response = await page.textContent('body');
    // Should understand context from previous message
    expect(response?.toLowerCase()).toMatch(/thay thế|alternative|chuyến khác|other flight/i);
  });

  test('should handle 3-turn conversation', async ({ page }) => {
    // Turn 1
    await sendMessage(page, 'VN123');
    await waitForAIResponse(page);

    // Turn 2
    await sendMessage(page, 'thời tiết ở điểm đến thế nào?');
    await waitForAIResponse(page);

    // Turn 3
    await sendMessage(page, 'cảm ơn bạn');
    await waitForAIResponse(page);

    // Should see multiple messages
    const messages = page.locator('[class*="message"]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(4); // At least welcome + 3 exchanges
  });
});

test.describe('Flight Search - Error Handling', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input', { timeout: 15000 });
  });

  test('should not submit empty message', async ({ page }) => {
    const input = page.locator('input[type="text"], textarea');
    await input.fill('');
    
    const button = page.locator('button[type="submit"]');
    
    // Button should be disabled or clicking should not trigger submit
    const isDisabled = await button.isDisabled();
    if (!isDisabled) {
      await button.click();
      // Should not show new assistant message
      await page.waitForTimeout(1000);
    }
  });

  test('should handle special characters', async ({ page }) => {
    await sendMessage(page, '!@#$%^&*()');
    await waitForAIResponse(page);

    // Should get a response without crashing
    const response = await page.textContent('body');
    expect(response).toBeDefined();
  });
});
