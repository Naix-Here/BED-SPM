// server.js — Bootstrap: connect to DB, then start the Express app.
require('dotenv').config();

const app = require('./app');
const { poolConnect } = require('./config/dbConfig');

const PORT = process.env.PORT || 3000;

poolConnect
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to establish database connection:', err);
    process.exit(1);
  });
