import { Page, Locator } from '@playwright/test';

export class ChatPage {
    readonly page: Page;
    readonly messageInput: Locator;
    readonly sendButton: Locator;
    readonly assistantMessages: Locator;

    constructor(page: Page) {
        this.page = page;
        this.messageInput = page.locator('[data-testid="chat-input"]');
        this.sendButton = page.locator('[data-testid="chat-submit"]');
        this.assistantMessages = page.locator('[data-testid="message-assistant"]');
    }

    async goto() {
        await this.page.goto('/');
        await this.page.waitForLoadState('networkidle');
    }

    async sendMessage(message: string) {
        await this.messageInput.fill(message);
        await this.sendButton.click();
    }

    async waitForResponse(timeout = 30000) {
        const initialCount = await this.assistantMessages.count();
        await this.page.waitForFunction(
            (count) => document.querySelectorAll('.message-assistant, [class*="assistant"], [data-testid="message-assistant"]').length > count,
            initialCount,
            { timeout }
        );
    }

    async getLastResponse(): Promise<string> {
        const messages = await this.assistantMessages.all();
        if (messages.length === 0) return '';
        return await messages[messages.length - 1].textContent() || '';
    }
}
