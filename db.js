const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Configure for serverless with fetch mode (faster cold starts)
const sql = neon(process.env.DATABASE_URL, {
  fetchConnectionCache: true,
  fullResults: false
});

module.exports = sql;