const sql = require('mssql');

async function test() {
  // Windows Auth - uses current process identity
  try {
    const pool = await sql.connect({
      server: 'localhost',
      port: 1433,
      database: 'master',
      options: { encrypt: false, trustServerCertificate: true, trustedConnection: true }
    });
    console.log('✅ Connected via Windows Auth!');
    const result = await pool.query("SELECT DB_ID('HawkerCentreMS') AS dbId");
    console.log('Database HawkerCentreMS exists:', result.recordset[0].dbId !== null);
    await pool.close();
    return;
  } catch (err) {
    console.log('❌ Windows Auth failed:', err.message);
  }

  // Windows Auth with explicit username
  try {
    const pool = await sql.connect({
      server: 'localhost',
      port: 1433,
      database: 'master',
      authentication: { type: 'ntlm', options: { domain: '7700-4070-32g', userName: 'user', password: '' } },
      options: { encrypt: false, trustServerCertificate: true }
    });
    console.log('✅ Connected via NTLM!');
    await pool.close();
  } catch (err) {
    console.log('❌ NTLM failed:', err.message);
  }

  // List databases with Windows Auth
  try {
    const pool = await sql.connect({
      server: 'localhost',
      port: 1433,
      options: { encrypt: false, trustServerCertificate: true, trustedConnection: true }
    });
    const result = await pool.query("SELECT name FROM sys.databases WHERE state=0 ORDER BY name");
    console.log('Available databases:', result.recordset.map(r => r.name).join(', '));
    await pool.close();
  } catch (err) {
    console.log('Could not list databases:', err.message);
  }
}

test();
