// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const app = express();

// --- Core Dependencies ---
const db = require('./db'); // The Knex connection utility
const countryRoutes = require('./routes/countryRoutes'); // Your API routes

// Use the PORT from .env, or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic sanity check route
app.get('/', (req, res) => {
    // Optional: Include status checks here later if desired
    res.send('Country Currency & Exchange API is running!');
});

// --- API Routes ---
// Connect the country routes to the /countries path
app.use('/countries', countryRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    // Check DB connection on startup (handled in db.js, but good to see confirmation)
});