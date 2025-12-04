const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Use the connection string from Neon
const sql = neon(process.env.DATABASE_URL);

module.exports = sql;