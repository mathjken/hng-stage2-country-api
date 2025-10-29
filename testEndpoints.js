// testEndpoints.js
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'; // or your Heroku URL

async function testEndpoints() {
  try {
    console.log('--- Testing POST /countries/refresh ---');
    const refresh = await axios.post(`${BASE_URL}/countries/refresh`);
    console.log(refresh.data);

    console.log('--- Testing GET /countries ---');
    const countries = await axios.get(`${BASE_URL}/countries`);
    console.log('Total countries:', countries.data.meta.total);

    console.log('--- Testing GET /countries/:name ---');
    const nigeria = await axios.get(`${BASE_URL}/countries/Nigeria`).catch(err => err.response);
    console.log('Nigeria:', nigeria.data);

    console.log('--- Testing DELETE /countries/:name ---');
    const deleteTest = await axios.delete(`${BASE_URL}/countries/NonExistentCountry`).catch(err => err.response);
    console.log('Delete non-existent:', deleteTest.data);

    console.log('--- Testing GET /status ---');
    const status = await axios.get(`${BASE_URL}/status`);
    console.log(status.data);

    console.log('--- Testing GET /countries/image ---');
    const image = await axios.get(`${BASE_URL}/countries/image`, { responseType: 'arraybuffer' });
    console.log('Image bytes received:', image.data.byteLength);

    console.log('✅ All endpoints tested successfully.');
  } catch (error) {
    console.error('❌ Endpoint test failed:', error.message);
  }
}

testEndpoints();
