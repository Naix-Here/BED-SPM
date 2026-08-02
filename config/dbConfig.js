// config/dbConfig.js — Shared SQL Server connection pool.
require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'bed_database',
  user: process.env.DB_USER || 'booksapi_user',
  password: process.env.DB_PASSWORD || 'password',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Shared connection pool (singleton) — reuse across all models.
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

poolConnect
  .then(() => {
    console.log('Database connection pool established.');
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
  });

module.exports = { sql, pool, poolConnect, dbConfig };
