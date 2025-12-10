const { api } = require('./setup');

describe('Chat API', () => {
  const TIMEOUT = 60000;

  describe('POST /api/chat', () => {
    test('processes flight code query', async () => {
      const res = await api.post('/api/chat', {
        message: 'VN456',
        history: []
      }, { timeout: TIMEOUT });

      expect(res.status).toBe(200);
      expect(res.body.response).toBeTruthy();
      expect(res.body.response.toLowerCase()).toMatch(/vn456|chuyến bay|flight/);
    }, TIMEOUT);

    test('processes weather query', async () => {
      const res = await api.post('/api/chat', {
        message: 'thời tiết Hà Nội',
        history: []
      }, { timeout: TIMEOUT });

      expect(res.status).toBe(200);
      expect(res.body.response).toBeTruthy();
    }, TIMEOUT);

    test('rejects empty message', async () => {
      const res = await api.post('/api/chat', {
        message: '',
        history: []
      });

      expect(res.status).toBe(400);
    });

    test('maintains conversation context', async () => {
      const history = [
        { role: 'user', content: 'Tra cứu chuyến VN456' },
        { role: 'assistant', content: 'Chuyến VN456 đang bị delay 45 phút.' }
      ];

      const res = await api.post('/api/chat', {
        message: 'Tôi được bồi thường không?',
        history
      }, { timeout: TIMEOUT });

      expect(res.status).toBe(200);
      expect(res.body.response).toBeTruthy();
    }, TIMEOUT);
  });
});
