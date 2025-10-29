// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const app = express();

// --- Core Dependencies ---
const db = require('./db');
const countryRoutes = require('./routes/countryRoutes');

// Use PORT from .env or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/countries', countryRoutes);

// --- Global Status Route ---
app.get('/status', async (req, res) => {
  try {
    const status = await db('status').where({ id: 1 }).first();
    if (!status) {
      return res.status(500).json({ error: 'Database status record not found.' });
    }
    res.status(200).json({
      total_countries: status.total_countries,
      last_refreshed_at: status.last_refreshed_at
        ? status.last_refreshed_at.toISOString()
        : null,
      cache_status: status.total_countries > 0 ? 'READY' : 'EMPTY',
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Internal server error while fetching status.' });
  }
});

// --- Root sanity check ---
app.get('/', (req, res) => {
  res.send('🌍 Country Currency & Exchange API is running successfully!');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
});
