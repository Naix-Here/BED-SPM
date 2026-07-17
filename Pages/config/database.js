const sql = require('mssql');
const dbConfig = require('../dbconfig');

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect({
      ...dbConfig,
      port: Number(process.env.DB_PORT || dbConfig.port || 1433),
      options: { encrypt: false, trustServerCertificate: true, ...(dbConfig.options || {}) }
    }).catch(error => { poolPromise = null; throw error; });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
