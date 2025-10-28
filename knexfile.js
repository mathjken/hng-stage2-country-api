require('dotenv').config({ path: './.env' });

const dbConfig = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'secret',
      database: process.env.DB_NAME || 'hng_stage2',
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    debug: true,
  },

  production: {
    client: 'mysql2',
    connection: process.env.JAWSDB_URL, // ✅ Heroku auto-provides this
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    pool: { min: 2, max: 10 },
  },
};

module.exports = dbConfig;
