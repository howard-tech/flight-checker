const request = require('supertest');
require('dotenv').config({ path: '.env.test' });

const API_URL = process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * API client for testing
 */
const api = {
  get: (path) => request(API_URL).get(path),
  
  post: (path, body) => request(API_URL)
    .post(path)
    .send(body)
    .set('Content-Type', 'application/json'),
  
  put: (path, body) => request(API_URL)
    .put(path)
    .send(body)
    .set('Content-Type', 'application/json'),
  
  delete: (path) => request(API_URL).delete(path),
};

/**
 * Wait helper
 * @param {number} ms - milliseconds to wait
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry helper for flaky operations
 * @param {Function} fn - async function to retry
 * @param {number} retries - number of retries
 * @param {number} delay - delay between retries in ms
 */
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1}/${retries} after error: ${error.message}`);
      await wait(delay);
    }
  }
};

/**
 * Check if API is healthy before running tests
 */
const checkApiHealth = async () => {
  try {
    const res = await api.get('/api/health');
    return res.status === 200 && res.body.status === 'ok';
  } catch (error) {
    return false;
  }
};

module.exports = { 
  api, 
  API_URL, 
  wait, 
  retry, 
  checkApiHealth 
};
