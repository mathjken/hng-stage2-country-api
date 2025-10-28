const knexfile = require('./knexfile');
const knex = require('knex');

// Initialize the Knex connection pool using the 'development' configuration
const db = knex(knexfile.development);

// Simple check to ensure connection is working on startup
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ MySQL connection established successfully.');
  })
  .catch((err) => {
    console.error('❌ Failed to establish MySQL connection:', err.message);
    // Important: Exit the process if DB connection fails, as the API is useless without it
    // process.exit(1);
  });

module.exports = db;