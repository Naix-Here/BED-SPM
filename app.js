// server.js — Bootstrap: connect to DB, then start the Express app.
require('dotenv').config();

const server = require('./server');
const { poolConnect } = require('./config/dbConfig');

const PORT = process.env.PORT || 3000;

poolConnect
  .then(() => {
    server.listen(PORT, () => {
      console.log(`server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to establish database connection:', err);
    process.exit(1);
  });
