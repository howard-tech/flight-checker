const request = require('supertest');
require('dotenv').config({ path: __dirname + '/../__config__/.env.test' });

const API_URL = process.env.API_BASE_URL || 'http://localhost:3001';

class APIClient {
    constructor(baseUrl = API_URL) {
        this.baseUrl = baseUrl;
    }

    async get(path, options = {}) {
        const { timeout = 30000 } = options;
        return request(this.baseUrl)
            .get(path)
            .timeout(timeout);
    }

    async post(path, body, options = {}) {
        const { timeout = 30000 } = options;
        return request(this.baseUrl)
            .post(path)
            .send(body)
            .set('Content-Type', 'application/json')
            .timeout(timeout);
    }
}

const api = new APIClient();

module.exports = { APIClient, api, API_URL };
