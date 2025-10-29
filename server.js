require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./db');
const countryRoutes = require('./routes/countryRoutes');

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/countries', countryRoutes);

app.get('/status', async (req, res) => {
  try {
    const status = await db('status').where({ id: 1 }).first();
    if (!status) return res.status(500).json({ error: 'Database status record not found.' });

    res.status(200).json({
      total_countries: Number(status.total_countries) || 0,
      last_refreshed_at: status.last_refreshed_at
        ? status.last_refreshed_at.toISOString()
        : null,
      cache_status: Number(status.total_countries) > 0 ? 'READY' : 'EMPTY',
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Internal server error while fetching status.' });
  }
});

app.get('/', (req, res) => res.send('Country Currency & Exchange API is running!'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ${process.env.DB_NAME}`);
});
