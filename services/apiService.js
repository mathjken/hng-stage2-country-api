require('dotenv').config();
const axios = require('axios');

// Constants from .env
const COUNTRIES_API_URL = process.env.COUNTRIES_API_URL;
const EXCHANGE_RATE_API_URL = process.env.EXCHANGE_RATE_API_URL;
const EXTERNAL_TIMEOUT = parseInt(process.env.EXTERNAL_TIMEOUT) || 8000; // Use the timeout from .env.example

/**
 * Standardized function to handle external API calls with timeout and error handling.
 * @param {string} url The external API URL.
 * @param {string} apiName A friendly name for error messages (e.g., 'Countries API').
 */
async function fetchExternalData(url, apiName) {
    try {
        console.log(`Fetching data from ${apiName}...`);
        const response = await axios.get(url, {
            timeout: EXTERNAL_TIMEOUT,
            headers: {
                'Accept': 'application/json',
            }
        });

        // Basic check for successful HTTP status code
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`API returned non-200 status: ${response.status}`);
        }

        return response.data;
    } catch (error) {
        // Handle common network errors (timeout, connection refused, etc.)
        const details = error.code === 'ECONNABORTED' 
            ? `${apiName} timed out after ${EXTERNAL_TIMEOUT}ms`
            : error.message;

        console.error(`Error fetching data from ${apiName}:`, details);

        // Throw an error that our refresh handler can catch and translate to 503
        const apiError = new Error(`Could not fetch data from ${apiName}`);
        apiError.isExternalError = true;
        apiError.apiName = apiName;
        throw apiError;
    }
}

/**
 * Fetches all country data from restcountries.com.
 * @returns {Promise<Array<Object>>} Array of country objects.
 */
async function fetchCountries() {
    return fetchExternalData(COUNTRIES_API_URL, 'Countries API');
}

/**
 * Fetches the base USD exchange rates from open.er-api.com.
 * @returns {Promise<Object>} Object containing exchange rates, e.g., { "NGN": 1600.23, ... }
 */
async function fetchExchangeRates() {
    const data = await fetchExternalData(EXCHANGE_RATE_API_URL, 'Exchange Rate API');
    
    // Validate and return only the rates object
    if (!data || !data.rates) {
        throw new Error('Exchange Rate API response format invalid: missing rates object.');
    }
    return data.rates;
}

module.exports = {
    fetchCountries,
    fetchExchangeRates,
};