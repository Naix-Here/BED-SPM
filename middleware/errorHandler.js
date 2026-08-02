// middleware/errorHandler.js — Centralised Express error handler.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
