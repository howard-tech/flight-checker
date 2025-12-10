import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/ChatPage';

test.describe('Flight Search', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
  });

  test('search on-time flight VN123', async () => {
    await chatPage.sendMessage('VN123');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastResponse();
    expect(response).toContain('VN123');
    expect(response.toLowerCase()).toMatch(/on\s*time|đúng giờ/i);
  });

  test('search delayed flight VN456', async () => {
    await chatPage.sendMessage('Tra cứu chuyến VN456');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastResponse();
    expect(response).toContain('VN456');
    expect(response.toLowerCase()).toMatch(/delay|trễ|chậm/i);
  });

  test('search cancelled flight QH101', async () => {
    await chatPage.sendMessage('QH101');
    await chatPage.waitForResponse();

    const response = await chatPage.getLastResponse();
    expect(response).toContain('QH101');
    expect(response.toLowerCase()).toMatch(/cancel|hủy/i);
  });
});
