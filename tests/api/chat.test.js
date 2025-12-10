const { api, wait } = require('./setup');

describe('Chat API', () => {
  
  describe('POST /api/chat - Basic functionality', () => {
    
    test('should accept valid chat message', async () => {
      const res = await api.post('/api/chat', {
        message: 'Hello',
        history: []
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('response');
    });

    test('should return error for empty message', async () => {
      const res = await api.post('/api/chat', {
        message: '',
        history: []
      });

      expect(res.status).toBe(400);
    });

    test('should return error for missing message field', async () => {
      const res = await api.post('/api/chat', {
        history: []
      });

      expect(res.status).toBe(400);
    });

    test('should handle missing history gracefully', async () => {
      const res = await api.post('/api/chat', {
        message: 'VN123'
      });

      // Should work without history
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('POST /api/chat - Flight queries', () => {
    
    test('should search flight by code VN123', async () => {
      const res = await api.post('/api/chat', {
        message: 'VN123',
        history: []
      });

      expect(res.status).toBe(200);
      expect(res.body.response.toLowerCase()).toMatch(/vn123|vietnam/i);
    });

    test('should handle delayed flight VN456', async () => {
      const res = await api.post('/api/chat', {
        message: 'Tra cứu chuyến VN456',
        history: []
      });

      expect(res.status).toBe(200);
      expect(res.body.response.toLowerCase()).toMatch(/vn456|delay|trễ/i);
    });

    test('should handle cancelled flight QH101', async () => {
      const res = await api.post('/api/chat', {
        message: 'QH101',
        history: []
      });

      expect(res.status).toBe(200);
      expect(res.body.response.toLowerCase()).toMatch(/qh101|cancel|hủy/i);
    });

    test('should report tools used if available', async () => {
      const res = await api.post('/api/chat', {
        message: 'VN123',
        history: []
      });

      // tools_used is optional
      if (res.body.tools_used) {
        expect(Array.isArray(res.body.tools_used)).toBe(true);
      }
    });
  });

  describe('POST /api/chat - Weather queries', () => {
    
    test('should handle weather query for Hanoi', async () => {
      const res = await api.post('/api/chat', {
        message: 'thời tiết Hà Nội',
        history: []
      });

      expect(res.status).toBe(200);
      expect(res.body.response).toBeDefined();
    });

    test('should handle weather query in English', async () => {
      const res = await api.post('/api/chat', {
        message: 'weather in SGN',
        history: []
      });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/chat - Conversation context', () => {
    
    test('should maintain context with history', async () => {
      // First message
      const res1 = await api.post('/api/chat', {
        message: 'VN456',
        history: []
      });

      expect(res1.status).toBe(200);

      // Follow-up with history
      const res2 = await api.post('/api/chat', {
        message: 'có chuyến nào thay thế không?',
        history: [
          { role: 'user', content: 'VN456' },
          { role: 'assistant', content: res1.body.response }
        ]
      });

      expect(res2.status).toBe(200);
      expect(res2.body.response).toBeDefined();
    });

    test('should handle multi-turn conversation', async () => {
      const history = [];

      // Turn 1
      const res1 = await api.post('/api/chat', {
        message: 'Xin chào',
        history
      });
      history.push({ role: 'user', content: 'Xin chào' });
      history.push({ role: 'assistant', content: res1.body.response });

      // Turn 2
      const res2 = await api.post('/api/chat', {
        message: 'Tra cứu VN123',
        history
      });
      history.push({ role: 'user', content: 'Tra cứu VN123' });
      history.push({ role: 'assistant', content: res2.body.response });

      // Turn 3
      const res3 = await api.post('/api/chat', {
        message: 'Cảm ơn',
        history
      });

      expect(res3.status).toBe(200);
    });
  });

  describe('POST /api/chat - Error handling', () => {
    
    test('should handle unknown flight gracefully', async () => {
      const res = await api.post('/api/chat', {
        message: 'UNKNOWN999',
        history: []
      });

      expect(res.status).toBe(200);
      // Should return a helpful message, not crash
      expect(res.body.response).toBeDefined();
    });

    test('should handle special characters', async () => {
      const res = await api.post('/api/chat', {
        message: 'VN123 @#$%',
        history: []
      });

      expect([200, 400]).toContain(res.status);
    });

    test('should handle very long message', async () => {
      const longMessage = 'a'.repeat(5000);
      const res = await api.post('/api/chat', {
        message: longMessage,
        history: []
      });

      // Should either process or return appropriate error
      expect([200, 400, 413]).toContain(res.status);
    });
  });
});
