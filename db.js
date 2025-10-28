const knexfile = require('./knexfile');
const knex = require('knex');

// Use 'production' config if JAWSDB_URL exists (Heroku), otherwise 'development'
const env = process.env.JAWSDB_URL ? 'production' : 'development';

const db = knex(knexfile[env]);

// Simple check to ensure connection is working on startup
db.raw('SELECT 1')
  .then(() => {
    console.log(`✅ MySQL connection established successfully (${env}).`);
  })
  .catch((err) => {
    console.error(`❌ Failed to establish MySQL connection (${env}):`, err.message);
    // Exit process if DB connection fails
    process.exit(1);
  });

module.exports = db;