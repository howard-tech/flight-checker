import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/ChatPage';

test.describe('Chat Conversation', () => {
    let chatPage: ChatPage;

    test.beforeEach(async ({ page }) => {
        chatPage = new ChatPage(page);
        await chatPage.goto();
    });

    test('multi-turn conversation', async () => {
        // Turn 1
        await chatPage.sendMessage('VN456');
        await chatPage.waitForResponse();
        let response = await chatPage.getLastResponse();
        expect(response).toContain('VN456');

        // Turn 2
        await chatPage.sendMessage('Tại sao bị delay?');
        await chatPage.waitForResponse();
        response = await chatPage.getLastResponse();
        expect(response.toLowerCase()).toMatch(/weather|thời tiết|lý do/i);

        // Turn 3
        await chatPage.sendMessage('Tôi có được bồi thường không?');
        await chatPage.waitForResponse();
        response = await chatPage.getLastResponse();
        expect(response.toLowerCase()).toMatch(/bồi thường|compensation/i);
    });
});
