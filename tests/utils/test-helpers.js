const flights = require('../fixtures/flights.json');
const airports = require('../fixtures/airports.json');

/**
 * Get flight fixture by type
 * @param {'onTime' | 'delayed' | 'cancelled' | 'vietjet'} type
 */
const getFlightFixture = (type) => flights[type];

/**
 * Get airport fixture by code
 * @param {'SGN' | 'HAN' | 'DAD' | 'PQC'} code
 */
const getAirportFixture = (code) => airports[code];

/**
 * Get all flights as array
 */
const getAllFlights = () => Object.values(flights);

/**
 * Get all airports as array
 */
const getAllAirports = () => Object.values(airports);

/**
 * Create custom test flight with overrides
 * @param {Object} overrides
 */
const createTestFlight = (overrides = {}) => ({
  flight_code: 'TEST001',
  airline: 'Test Airlines',
  from_airport: 'SGN',
  to_airport: 'HAN',
  departure_time: '10:00',
  arrival_time: '12:00',
  status: 'On Time',
  gate: 'T1',
  terminal: 'A1',
  aircraft: 'A320',
  price: 2000000,
  delay_minutes: 0,
  ...overrides
});

/**
 * Wait helper
 * @param {number} ms - milliseconds to wait
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - async function to retry
 * @param {number} retries - number of retries
 * @param {number} initialDelay - initial delay in ms
 */
const retry = async (fn, retries = 3, initialDelay = 1000) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`Retry ${i + 1}/${retries} after error: ${error.message}`);
      if (i < retries - 1) {
        await wait(initialDelay * Math.pow(2, i));
      }
    }
  }
  throw lastError;
};

/**
 * Generate random flight code
 */
const generateFlightCode = () => {
  const airlines = ['VN', 'VJ', 'QH', 'BL'];
  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const number = Math.floor(Math.random() * 900) + 100;
  return `${airline}${number}`;
};

/**
 * Calculate expected compensation based on delay
 * @param {number} delayMinutes
 * @param {number} ticketPrice
 */
const calculateExpectedCompensation = (delayMinutes, ticketPrice) => {
  if (delayMinutes < 120) {
    return { eligible: false, amount: 0 };
  }
  if (delayMinutes < 180) {
    return { eligible: true, amount: Math.round(ticketPrice * 0.25) };
  }
  return { eligible: true, amount: Math.round(ticketPrice * 0.5) };
};

/**
 * Format currency VND
 * @param {number} amount
 */
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

module.exports = {
  getFlightFixture,
  getAirportFixture,
  getAllFlights,
  getAllAirports,
  createTestFlight,
  wait,
  retry,
  generateFlightCode,
  calculateExpectedCompensation,
  formatVND
};
