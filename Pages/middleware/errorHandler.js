function notFound(req, res) { res.status(404).json({ error: 'The requested page or API endpoint was not found.' }); }
function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, error.message);
  if (res.headersSent) return next(error);
  if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
  if (error.number === 2627 || error.number === 2601) return res.status(409).json({ error: 'An account with this email already exists.' });
  if (error.code === 'ESOCKET' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEOUT' || error.code === 'ELOGIN') return res.status(503).json({ error: 'Database connection failed. Check dbconfig.js, SQL Server, and run database_setup.sql.' });
  if (error.number === 208 || error.number === 207) return res.status(503).json({ error: 'Database tables are missing or outdated. Run database_setup.sql in SSMS.' });
  res.status(500).json({ error: 'The server could not complete that request. Check the server terminal for details.' });
}
module.exports = { notFound, errorHandler };
