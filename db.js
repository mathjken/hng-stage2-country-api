const knexfile = require('./knexfile');
const knex = require('knex');

// Determine the environment: 
// Use 'production' if JAWSDB_URL is set (which Heroku/JawsDB does automatically), 
// otherwise use 'development'.
const env = process.env.JAWSDB_URL ? 'production' : 'development';

// Load the appropriate configuration from knexfile.js
const db = knex(knexfile[env]);

// Simple check to ensure connection is working on startup
db.raw('SELECT 1')
  .then(() => {
    console.log(`✅ MySQL connection established successfully (${env}).`);
  })
  .catch((err) => {
    console.error(`❌ Failed to establish MySQL connection (${env}):`, err.message);
    // Crucial: Exit process if DB connection fails, as the API is useless without it
    process.exit(1);
  });

module.exports = db;